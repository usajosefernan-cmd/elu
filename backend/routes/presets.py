from fastapi import APIRouter, Body
from services.smart_presets_service import smart_presets_service
from services.dictator_prompt_builder import build_dictator_prompt, get_preset_mode
from services.supabase_service import supabase_db
from services.thumbnail_service import thumbnail_service
import random

router = APIRouter(prefix="/presets", tags=["presets"])


@router.get("/system")
async def get_system_presets():
    """Obtiene todos los presets del sistema."""
    presets = smart_presets_service.get_system_presets()
    return {"success": True, "presets": presets}


@router.get("/user/{user_id}")
async def get_user_presets(user_id: str):
    """Obtiene los presets personalizados de un usuario."""
    presets = await smart_presets_service.get_user_presets(user_id)
    return {"success": True, "presets": presets}


@router.post("/user/{user_id}")
async def save_user_preset(user_id: str, body: dict):
    """Guarda un nuevo preset para el usuario en Supabase."""
    try:
        result = await smart_presets_service.save_user_preset(
            user_id=user_id,
            name=body.get('name', 'My Preset'),
            slider_values=body.get('slider_values', {}),
            locked_pillars=body.get('locked_pillars', []),
            narrative_anchor=body.get('narrative_anchor')
        )
        
        if result:
            return {"success": True, "preset": result}
        return {"success": False, "error": "Failed to save preset - no data returned"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================
# 🔥 NEW: Save Style v40.1 - THE DICTATOR PROMPT
# ============================================================
@router.post("/v40/save-style")
async def save_style_v40(body: dict = Body(...)):
    """
    Guarda un preset v40.1 con:
    - Sliders bloqueados (locked_sliders) - valores fijos que no se pueden cambiar
    - Sliders libres - el usuario puede ajustar
    - Thumbnail de la foto original (max 1024px, webp 80%)
    - Descripción del preset
    - The Dictator Prompt para consistencia estilística
    
    Request body:
    {
        "user_id": "uuid",
        "name": "Cyberpunk Night",
        "description": "Estilo futurista con luces neón...",
        "seed": 847291023,
        "temperature": 0.75,
        "sliders_config": {
            "photoscaler": {...},
            "stylescaler": {...},
            "lightscaler": {...}
        },
        "locked_sliders": ["styling_ropa", "limpieza_entorno", "key_light"],
        "source_image": "https://... or data:image/..."
    }
    """
    try:
        user_id = body.get('user_id')
        name = body.get('name', 'Mi Estilo')
        description = body.get('description', '')  # Nueva: descripción del preset
        seed = body.get('seed', random.randint(100000000, 999999999))
        temperature = body.get('temperature', 0.75)
        top_k = body.get('top_k', 40)
        top_p = body.get('top_p', 0.9)
        sliders_config = body.get('sliders_config', {})
        locked_sliders = body.get('locked_sliders', [])
        source_image = body.get('source_image')
        
        # ============================================================
        # 🖼️ GENERAR THUMBNAIL (max 1024px, webp 80%)
        # ============================================================
        thumbnail_base64 = None
        if source_image:
            if source_image.startswith('data:image'):
                # Base64 image
                thumb_data, _ = thumbnail_service.create_thumbnail_from_base64(source_image)
                thumbnail_base64 = thumb_data
            elif source_image.startswith('http'):
                # URL image
                thumb_data, _ = await thumbnail_service.create_thumbnail_from_url(source_image)
                thumbnail_base64 = thumb_data
            
            if thumbnail_base64:
                print(f"[SaveStyle v40] Thumbnail created: {len(thumbnail_base64)//1024}KB")
        
        # ============================================================
        # 🔒 DETECTAR SLIDERS BLOQUEADOS
        # Si no se especifican, bloquear los que tienen valor > 8 (dominantes)
        # ============================================================
        if not locked_sliders:
            # Auto-detectar sliders dominantes como bloqueados
            for pilar, sliders in sliders_config.items():
                if isinstance(sliders, dict):
                    for key, value in sliders.items():
                        if isinstance(value, (int, float)) and value > 8:
                            locked_sliders.append(key)
        
        # 🔥 BUILD THE DICTATOR PROMPT
        style_lock_prompt, dominant_sliders = build_dictator_prompt(sliders_config, threshold=8)
        
        # Determine mode based on dominant sliders
        mode = get_preset_mode(sliders_config)
        
        # Prepare extended slider_values con locked_sliders
        extended_slider_values = {
            # Original slider values
            **sliders_config,
            # v40 extensions
            "_v40_meta": {
                "seed": seed,
                "temperature": temperature,
                "top_k": top_k,
                "top_p": top_p,
                "description": description,  # 📝 Descripción del preset
                "style_lock_prompt": style_lock_prompt,
                "dominant_sliders": dominant_sliders,
                "locked_sliders": locked_sliders,  # 🔒 Sliders que NO se pueden editar
                "mode": mode,
                "thumbnail_base64": thumbnail_base64,  # 🖼️ Thumbnail en base64 webp
                "version": "v40.2"
            }
        }
        
        # Determine locked_pillars based on locked sliders
        locked_pillars = []
        for ds in dominant_sliders:
            pilar = ds.get('pilar', '').upper()
            if pilar and pilar not in locked_pillars:
                locked_pillars.append(pilar)
        
        # Insert into smart_presets table
        preset_data = {
            'user_id': user_id,
            'name': name,
            'slider_values': extended_slider_values,
            'locked_pillars': locked_pillars
        }
        
        response = supabase_db.client.table("smart_presets")\
            .insert(preset_data)\
            .execute()
        
        if response.data:
            saved_preset = response.data[0]
            print(f"[SaveStyle v40] Saved '{name}' with {len(locked_sliders)} locked sliders, mode={mode}")
            return {
                "success": True,
                "preset": saved_preset,
                "preset_info": {
                    "id": saved_preset.get('id'),
                    "name": name,
                    "mode": mode,
                    "locked_sliders": locked_sliders,
                    "has_thumbnail": thumbnail_base64 is not None,
                    "seed": seed,
                    "temperature": temperature
                }
            }
        
        return {"success": False, "error": "No data returned from insert"}
        
    except Exception as e:
        print(f"[SaveStyle v40] Error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/v40/user/{user_id}")
async def get_user_presets_v40(user_id: str):
    """
    Obtiene los presets v40 de un usuario con:
    - locked_sliders: sliders que NO se pueden editar
    - thumbnail: miniatura de la foto original
    - Dictator Prompt info
    """
    try:
        response = supabase_db.client.table("smart_presets")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        
        presets = response.data or []
        
        # Extract v40 data and format response
        processed_presets = []
        for preset in presets:
            slider_values = preset.get('slider_values', {})
            v40_meta = slider_values.get('_v40_meta', {})
            
            # Get slider config without meta
            sliders_config = {k: v for k, v in slider_values.items() if k != '_v40_meta'}
            
            processed_preset = {
                'id': preset.get('id'),
                'name': preset.get('name'),
                'created_at': preset.get('created_at'),
                'user_id': preset.get('user_id'),
                # Slider values
                'sliders_config': sliders_config,
                # Generation config
                'seed': v40_meta.get('seed'),
                'temperature': v40_meta.get('temperature'),
                'top_k': v40_meta.get('top_k', 40),
                'top_p': v40_meta.get('top_p', 0.9),
                # 📝 Description
                'description': v40_meta.get('description', ''),
                # 🔒 Locked sliders (NO se pueden editar)
                'locked_sliders': v40_meta.get('locked_sliders', []),
                # Style lock
                'style_lock_prompt': v40_meta.get('style_lock_prompt'),
                'mode': v40_meta.get('mode', 'SHOWMAN'),
                # 🖼️ Thumbnail
                'thumbnail_base64': v40_meta.get('thumbnail_base64'),
                # Info
                'preset_info': {
                    'has_style_lock': v40_meta.get('style_lock_prompt') is not None,
                    'locked_count': len(v40_meta.get('locked_sliders', [])),
                    'has_thumbnail': v40_meta.get('thumbnail_base64') is not None,
                    'has_description': bool(v40_meta.get('description')),
                    'mode': v40_meta.get('mode', 'SHOWMAN'),
                    'version': v40_meta.get('version', 'legacy')
                }
            }
            processed_presets.append(processed_preset)
        
        return {"success": True, "presets": processed_presets}
        
    except Exception as e:
        print(f"[GetPresets v40] Error: {e}")
        return {"success": False, "error": str(e), "presets": []}


@router.delete("/user/{user_id}/{preset_id}")
async def delete_user_preset(user_id: str, preset_id: str):
    """Elimina un preset del usuario de Supabase."""
    try:
        success = await smart_presets_service.delete_user_preset(user_id, preset_id)
        return {"success": success}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/{preset_id}")
async def get_preset_by_id(preset_id: str):
    """Obtiene un preset por ID."""
    preset = smart_presets_service.get_preset_by_id(preset_id)
    if preset:
        return {"success": True, "preset": preset.to_dict()}
    return {"success": False, "error": "Preset not found"}


@router.post("/blend")
async def blend_preset_with_auto(body: dict):
    """Mezcla un preset con configuración AUTO."""
    preset_id = body.get('preset_id')
    auto_settings = body.get('auto_settings', {})
    blend_factor = body.get('blend_factor', 0.5)
    
    preset = smart_presets_service.get_preset_by_id(preset_id)
    if not preset:
        return {"success": False, "error": "Preset not found"}
    
    result = smart_presets_service.blend_with_auto(preset, auto_settings, blend_factor)
    return {"success": True, "blended_config": result}

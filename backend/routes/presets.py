from fastapi import APIRouter, Body
from services.smart_presets_service import smart_presets_service
from services.dictator_prompt_builder import build_dictator_prompt, get_preset_mode
from services.supabase_service import supabase_db
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
    Guarda un preset v40.1 con "The Dictator Prompt" para consistencia estilística.
    
    Request body:
    {
        "user_id": "uuid",
        "name": "Cyberpunk Night",
        "seed": 847291023,
        "temperature": 0.75,
        "top_k": 40,
        "top_p": 0.9,
        "sliders_config": {
            "photoscaler": {...},
            "stylescaler": {...},
            "lightscaler": {...}
        },
        "thumbnail_url": "optional",
        "source_image_url": "optional"
    }
    """
    try:
        user_id = body.get('user_id')
        name = body.get('name', 'Mi Estilo')
        seed = body.get('seed', random.randint(100000000, 999999999))
        temperature = body.get('temperature', 0.75)
        top_k = body.get('top_k', 40)
        top_p = body.get('top_p', 0.9)
        sliders_config = body.get('sliders_config', {})
        thumbnail_url = body.get('thumbnail_url')
        source_image_url = body.get('source_image_url')
        
        # 🔥 BUILD THE DICTATOR PROMPT
        style_lock_prompt, dominant_sliders = build_dictator_prompt(sliders_config, threshold=8)
        
        # Determine mode based on dominant sliders
        mode = get_preset_mode(sliders_config)
        
        # Prepare data for Supabase
        preset_data = {
            'user_id': user_id,
            'name': name,
            'seed': seed,
            'temperature': temperature,
            'top_k': top_k,
            'top_p': top_p,
            'sliders_config': sliders_config,
            'style_lock_prompt': style_lock_prompt,
            'dominant_sliders': dominant_sliders if dominant_sliders else None,
            'mode': mode,
            'thumbnail_url': thumbnail_url,
            'source_image_url': source_image_url
        }
        
        # Insert into user_presets table
        response = supabase_db.client.table("user_presets")\
            .insert(preset_data)\
            .execute()
        
        if response.data:
            saved_preset = response.data[0]
            print(f"[SaveStyle v40] Saved '{name}' with {len(dominant_sliders)} dominant sliders, mode={mode}")
            return {
                "success": True,
                "preset": saved_preset,
                "dictator_info": {
                    "mode": mode,
                    "dominant_sliders": dominant_sliders,
                    "has_style_lock": style_lock_prompt is not None
                }
            }
        
        return {"success": False, "error": "No data returned from insert"}
        
    except Exception as e:
        print(f"[SaveStyle v40] Error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/v40/user/{user_id}")
async def get_user_presets_v40(user_id: str):
    """Obtiene los presets v40 de un usuario con info del Dictator Prompt."""
    try:
        response = supabase_db.client.table("user_presets")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        
        presets = response.data or []
        
        # Add dictator info to each preset
        for preset in presets:
            preset['dictator_info'] = {
                'has_style_lock': preset.get('style_lock_prompt') is not None,
                'dominant_count': len(preset.get('dominant_sliders', []) or []),
                'mode': preset.get('mode', 'SHOWMAN')
            }
        
        return {"success": True, "presets": presets}
        
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

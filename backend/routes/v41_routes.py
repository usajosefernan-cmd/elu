from fastapi import APIRouter, HTTPException, Body
from services.supabase_service import supabase_db
from services.vision_orchestrator_v41 import vision_orchestrator
from services.prompt_compiler_v41 import prompt_compiler_v41
from services.laozhang_service import laozhang_service
import uuid

router = APIRouter(prefix="/v41", tags=["v41"])


@router.post("/vision-orchestrator")
async def vision_orchestrator_endpoint(body: dict = Body(...)):
    """
    Vision Orchestrator v41
    
    Analiza imagen y clasifica usando taxonomy + diagnosis desde Supabase.
    
    Request:
    {
        "userId": "uuid",
        "biopsyUrls": {
            "thumbnail_base64": "...",
            "center_base64": "...",
            "shadow_base64": "...",
            "detail_base64": "...",
            "originalWidth": 4000,
            "originalHeight": 3000
        }
    }
    
    Response:
    - AUTO tier: {"status": "BATCH_PROCESSING", "count": 3, "analysis": {...}}
    - USER/PRO: {"status": "REVIEW_REQUIRED", "analysis": {...}, "final_prescription": {...}}
    """
    try:
        user_id = body.get('userId')
        biopsy_urls = body.get('biopsyUrls', {})
        
        if not user_id or not biopsy_urls:
            return {"success": False, "error": "Missing userId or biopsyUrls"}
        
        # Crear registro de upload
        upload_id = str(uuid.uuid4())
        
        upload_data = {
            'id': upload_id,
            'user_id': user_id,
            'original_width': biopsy_urls.get('originalWidth'),
            'original_height': biopsy_urls.get('originalHeight'),
            'biopsy_urls': biopsy_urls,
            'status': 'analyzing'
        }
        
        await supabase_db.client.table('uploads').insert(upload_data).execute()
        
        # Obtener perfil y tier del usuario
        profile_response = supabase_db.client.table('profiles')\
            .select('tier, token_balance')\
            .eq('id', user_id)\
            .execute()
        
        tier_code = 'AUTO'  # Default
        token_balance = 100
        
        if profile_response.data and len(profile_response.data) > 0:
            tier_code = profile_response.data[0].get('tier', 'AUTO')
            token_balance = profile_response.data[0].get('token_balance', 100)
        
        # Obtener tier config
        tier_response = supabase_db.client.table('tier_config')\
            .select('*')\
            .eq('tier_code', tier_code)\
            .execute()
        
        tier_config = tier_response.data[0] if tier_response.data else {}
        
        # Ejecutar análisis de vision
        thumbnail_base64 = biopsy_urls.get('thumbnail_base64', '')
        
        result = await vision_orchestrator.orchestrate_vision_analysis(
            thumbnail_base64,
            user_id,
            upload_id
        )
        
        if not result.get('success'):
            return {"success": False, "error": result.get('error', 'Vision analysis failed')}
        
        # Determinar respuesta según tier
        if tier_code == 'AUTO':
            # AUTO: Batch processing automático
            # TODO: Implementar batch generation
            return {
                "status": "BATCH_PROCESSING",
                "uploadId": upload_id,
                "count": tier_config.get('batch_size_limit', 1),
                "analysis": result['analysis'],
                "auto_settings": result['auto_settings']
            }
        else:
            # USER/PRO/PRO_LUX: Review required
            return {
                "status": "REVIEW_REQUIRED",
                "uploadId": upload_id,
                "analysis": result['analysis'],
                "final_prescription": result['auto_settings'],
                "can_refine": tier_config.get('can_refine', False),
                "can_upscale_8k": tier_config.get('can_upscale_8k', False),
                "tier": tier_code,
                "token_balance": token_balance
            }
        
    except Exception as e:
        print(f"[VisionOrchestrator Endpoint] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/prompt-compiler")
async def prompt_compiler_endpoint(body: dict = Body(...)):
    """
    Prompt Compiler v41
    
    Ensambla prompt desde slider_config usando slider_definitions de Supabase.
    
    Request:
    {
        "visionResult": {...},
        "sliderConfig": {p1: 5, p3: 9, s1: 7, ...},
        "savedPreset": {seed: 123, temperature: 0.4},
        "userMode": "pro"
    }
    
    Response:
    {
        "compiled_prompt": "...",
        "generation_config": {seed, strength, guidance_scale, sampler}
    }
    """
    try:
        vision_result = body.get('visionResult', {})
        slider_config = body.get('sliderConfig', {})
        saved_preset = body.get('savedPreset', {})
        user_mode = body.get('userMode', 'auto')
        
        # Detectar si hay persona
        has_person = vision_result.get('has_person', False)
        
        # Compilar prompt
        result = await prompt_compiler_v41.compile_from_sliders(
            slider_config,
            vision_result,
            has_person
        )
        
        if not result.get('success'):
            return {"success": False, "error": result.get('error', 'Compilation failed')}
        
        # Configuración de generación
        temperature = saved_preset.get('temperature', 0.4)
        seed = saved_preset.get('seed', None)
        
        generation_config = {
            'seed': seed if seed else None,
            'temperature': temperature,
            'top_k': 40,
            'top_p': 0.9
        }
        
        return {
            "success": True,
            "compiled_prompt": result['compiled_prompt'],
            "generation_config": generation_config,
            "metadata": result['metadata']
        }
        
    except Exception as e:
        print(f"[PromptCompiler Endpoint] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/save-preset")
async def save_preset_v41(body: dict = Body(...)):
    """
    Save Preset v41 con Smart Anchors
    
    Guarda no solo los sliders, sino la "esencia visual" de una generación exitosa.
    
    Request:
    {
        "userId": "uuid",
        "uploadId": "uuid",
        "presetName": "Restaurante Lujoso",
        "description": "Iluminación dramática para interiores",
        "userAnchors": {
            "background": true,     // Anclar fondo/ambiente
            "lighting": true,       // Anclar iluminación
            "clothes": false,       // No anclar ropa
            "pose": false          // No anclar pose
        },
        "currentSliders": {p1: 5, p3: 9, s1: 7, ...}
    }
    
    Response:
    {
        "success": true,
        "presetId": "uuid",
        "message": "Preset Anchored Successfully"
    }
    """
    try:
        user_id = body.get('userId')
        upload_id = body.get('uploadId')
        preset_name = body.get('presetName')
        description = body.get('description', '')
        user_anchors = body.get('userAnchors', {})
        current_sliders = body.get('currentSliders', {})
        
        if not user_id or not preset_name:
            return {"success": False, "error": "Missing userId or presetName"}
        
        # 1. Recuperar datos de la generación mágica
        if upload_id:
            gen_response = supabase_db.client.table('generations')\
                .select('prompt_used, config_used, clean_url, watermarked_url')\
                .eq('upload_id', upload_id)\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()
            
            gen_data = gen_response.data[0] if gen_response.data else {}
        else:
            gen_data = {}
        
        # 2. Detector de intención (Forense vs Showman)
        creative_triggers = [
            current_sliders.get('s3', 0),  # Ropa
            current_sliders.get('s5', 0),  # Fondo
            current_sliders.get('s8', 0),  # Color Cine
            current_sliders.get('l1', 0)   # Luz Key
        ]
        
        is_creative_mode = any(val > 5 for val in creative_triggers)
        
        # Parámetros de Nano Banana
        seed = gen_data.get('config_used', {}).get('seed') if gen_data else None
        if not seed:
            import random
            seed = random.randint(100000, 999999)
        
        nano_params = {
            'strength': 0.85 if is_creative_mode else 0.45,
            'guidance_scale': 4.0 if is_creative_mode else 7.5,
            'sampler': 'Euler a',
            'seed': seed,
            'temperature': 0.75 if is_creative_mode else 0.1
        }
        
        # 3. Lógica de anclaje visual (Smart Anchors)
        reference_url = None
        
        if user_anchors.get('background') or user_anchors.get('lighting') or user_anchors.get('style'):
            # Usar la imagen generada como referencia
            reference_url = gen_data.get('watermarked_url') or gen_data.get('clean_url')
        
        # 4. Guardar preset en DB
        preset_data = {
            'user_id': user_id,
            'name': preset_name,
            'description': description,
            'sliders_config': current_sliders,
            'nano_params': nano_params,
            'anchor_preferences': user_anchors,
            'reference_image_url': reference_url,
            'prompt_text': gen_data.get('prompt_used', ''),
            'thumbnail_base64': body.get('thumbnailBase64'),  # Si se envía desde frontend
            'is_global': False,
            'is_active': True
        }
        
        response = supabase_db.client.table('user_presets_v41').insert(preset_data).execute()
        
        if response.data:
            saved_preset = response.data[0]
            print(f"[SavePreset v41] Saved '{preset_name}' with anchors: {user_anchors}")
            
            return {
                "success": True,
                "presetId": saved_preset.get('id'),
                "message": "Preset Anchored Successfully",
                "preset": saved_preset
            }
        else:
            return {"success": False, "error": "Failed to save preset"}
        
    except Exception as e:
        print(f"[SavePreset v41] Error: {e}")
        import traceback



@router.get("/macro-definitions/{profile_tier}")
async def get_macro_definitions(profile_tier: str):
    """
    Obtiene las definiciones de macros para un perfil específico.
    
    Response:
    {
        "success": true,
        "macros": [
            {
                "macro_key": "restauracion",
                "ui_title": "Restauración",
                "ui_icon": "🛠️",
                "slave_sliders": ["p1", "p2", "p8", "p9"]
            },
            ...
        ]
    }
    """
    try:
        response = supabase_db.client.table('macro_definitions')\
            .select('*')\
            .eq('profile_tier', profile_tier.upper())\
            .execute()
        
        return {
            "success": True,
            "macros": response.data or []
        }
        
    except Exception as e:
        print(f"[GetMacroDefinitions] Error: {e}")
        return {"success": False, "error": str(e)}

        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.get("/presets/{user_id}")
async def get_presets_v41(user_id: str):
    """
    Obtiene los presets del usuario con Smart Anchors.
    
    Response:
    {
        "success": true,
        "presets": [
            {
                "id": "uuid",
                "name": "Restaurante Lujoso",
                "description": "...",
                "sliders_config": {...},
                "nano_params": {...},
                "anchor_preferences": {background: true, lighting: true, ...},
                "reference_image_url": "...",
                "thumbnail_base64": "..."
            }
        ]
    }
    """
    try:
        response = supabase_db.client.table('user_presets_v41')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('is_active', True)\
            .order('created_at', desc=True)\
            .execute()
        
        return {
            "success": True,
            "presets": response.data or []
        }
        
    except Exception as e:
        print(f"[GetPresets v41] Error: {e}")
        return {"success": False, "error": str(e)}

            vision_result,
            has_person
        )
        
        if not result.get('success'):
            return {"success": False, "error": result.get('error', 'Compilation failed')}
        
        # Configuración de generación
        temperature = saved_preset.get('temperature', 0.4)
        seed = saved_preset.get('seed', None)
        
        generation_config = {
            'seed': seed if seed else None,
            'temperature': temperature,
            'top_k': 40,
            'top_p': 0.9
        }
        
        return {
            "success": True,
            "compiled_prompt": result['compiled_prompt'],
            "generation_config": generation_config,
            "metadata": result['metadata']
        }
        
    except Exception as e:
        print(f"[PromptCompiler Endpoint] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/generate")
async def generate_v41_endpoint(body: dict = Body(...)):
    """
    Generate v41 con soporte para Smart Anchors
    
    Genera imagen usando Gemini con el prompt compilado.
    Si se usa un preset con anchors, usa la reference_image como guía.
    
    Request:
    {
        "uploadId": "uuid",
        "prompt": "...",
        "config": {seed, temperature, ...},
        "imageBase64": "...",
        "preset": {                         // Opcional: si se usa preset
            "id": "uuid",
            "reference_image_url": "...",
            "anchor_preferences": {background: true, lighting: true, ...},
            "nano_params": {...}
        }
    }
    """
    try:
        upload_id = body.get('uploadId')
        prompt = body.get('prompt')
        config = body.get('config', {})
        image_base64 = body.get('imageBase64')
        preset = body.get('preset')
        
        if not prompt or not image_base64:
            return {"success": False, "error": "Missing prompt or image"}
        
        # Si hay preset con Smart Anchors, modificar el prompt y añadir reference images
        reference_images = []
        
        if preset and preset.get('anchor_preferences'):
            anchors = preset.get('anchor_preferences', {})
            reference_url = preset.get('reference_image_url')
            
            # Añadir instrucciones de anclaje al prompt
            anchor_instructions = []
            
            if anchors.get('background') and reference_url:
                anchor_instructions.append("""
[SMART ANCHOR: BACKGROUND]
A reference image is provided showing the desired environment/background.
PRESERVE the background atmosphere, location, and set design from the reference.
Integrate the new subject into this existing environment naturally.""")
                # Añadir imagen de referencia para procesamiento multi-imagen
                if reference_url and reference_url.startswith('data:image'):
                    reference_images.append(reference_url.split(',')[1])
            
            if anchors.get('lighting') and reference_url:
                anchor_instructions.append("""
[SMART ANCHOR: LIGHTING]
A reference image is provided showing the desired lighting setup.
MATCH the lighting direction, quality, and mood from the reference.
Apply the same lighting scheme to the new subject.""")
            
            if anchors.get('style'):
                anchor_instructions.append("""
[SMART ANCHOR: STYLE]
Maintain the artistic style, color grading, and overall aesthetic from the reference.""")
            
            if anchor_instructions:
                prompt = prompt + "\n\n" + "\n".join(anchor_instructions)
            
            # Usar nano_params del preset si existen
            if preset.get('nano_params'):
                config.update(preset['nano_params'])
        
        # Generar con LaoZhang Nano Banana Pro
        print(f"[Generate v41] Generating with LaoZhang Nano Banana Pro...")
        print(f"[Generate v41] Preset mode: {bool(preset)}, Anchors: {preset.get('anchor_preferences') if preset else None}")
        
        # Configurar para LaoZhang
        laozhang_config = {
            'image_size': '4K',  # 4K por defecto
            'aspect_ratio': config.get('aspect_ratio', '1:1'),
            'reference_images': reference_images if reference_images else None
        }
        
        result = await laozhang_service.generate_with_nano_banana_pro(
            prompt=prompt,
            image_base64=image_base64,
            config=laozhang_config
        )
        
        if result.get('success'):
            # Guardar en generations table
            gen_data = {
                'upload_id': upload_id,
                'prompt_used': prompt,
                'config_used': config,
                'watermarked_url': result.get('image_base64'),
                'is_preview': True,
                'tokens_spent': 0
            }
            
            gen_response = await supabase_db.client.table('generations').insert(gen_data).execute()
            
            return {
                "success": True,
                "image_base64": result.get('image_base64'),
                "upload_id": upload_id,
                "generation_id": gen_response.data[0]['id'] if gen_response.data else None
            }
        else:
            return {"success": False, "error": result.get('error', 'Generation failed')}
        
    except Exception as e:
        print(f"[Generate v41 Endpoint] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

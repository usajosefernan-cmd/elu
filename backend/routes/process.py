from fastapi import APIRouter, HTTPException, Body
from services.supabase_service import supabase_db
from services.gemini_service import gemini_service
from services.vision_service import vision_service
from services.prompt_compiler_service import prompt_compiler
from services.input_normalizer import input_normalizer
from services.universal_prompt_assembler import assemble_prompt, get_prompt_preview
from data.macro_mappings import apply_user_macro, apply_pro_macro
from data.snippets import SNIPPET_DICTIONARY, map_value_to_level
import datetime

router = APIRouter(prefix="/process", tags=["process"])


@router.post("/analyze")
async def analyze_input(body: dict = Body(...)):
    """
    Vision analysis endpoint with Proxy Vision support.
    Uses 1024px thumbnails for 80% cost savings.
    """
    image_url = body.get('imageUrl')
    image_base64 = body.get('imageBase64')
    use_proxy = body.get('useProxy', True)  # Default: use proxy for efficiency

    if not image_url and not image_base64:
        return {"success": False, "error": "No image provided", "thumbnail_used": False, "tokens_consumed": 0}

    image_input = image_base64 or image_url
    
    # Use Vision Service with new Creative Director prompt
    analysis = await vision_service.analyze_image(image_input, use_proxy=use_proxy)
    
    if isinstance(analysis, dict) and analysis.get('error'):
        return {"success": False, "error": analysis.get('error'), "thumbnail_used": use_proxy, "tokens_consumed": 0}

    return {
        "success": True, 
        "analysis": analysis, 
        "thumbnail_used": use_proxy, 
        "tokens_consumed": 0,
        "category": analysis.get('category', 'OTHER'),
        "protocol_alerts": analysis.get('protocol_alerts', [])
    }


@router.post("/normalize")
async def normalize_image(body: dict = Body(...)):
    """
    Normalize image to 19.5MP max, JPEG sRGB format.
    """
    image_url = body.get('imageUrl')
    image_base64 = body.get('imageBase64')
    
    if not image_url and not image_base64:
        return {"success": False, "error": "No image provided"}
    
    image_input = image_base64 or image_url
    
    result = await input_normalizer.normalize(image_input)
    
    if not result['success']:
        return {"success": False, "error": result.get('error', 'Normalization failed')}
    
    return {
        "success": True,
        "normalized_base64": result['normalized_base64'],
        "metadata": result['metadata']
    }


@router.post("/compile")
async def compile_prompt_endpoint(body: dict = Body(...)):
    """
    FastAPI endpoint for prompt compilation v40.1 con Smart Mode Switch.
    Detecta automáticamente si el usuario quiere RESTAURACIÓN o CREATIVIDAD.
    """
    # Support both formats: sliderConfig (v40) and config (legacy)
    slider_config = body.get('sliderConfig') or body.get('config') or {}
    vision_analysis = body.get('visionAnalysis')
    profile_type = body.get('profileType', 'AUTO')
    mode = body.get('mode', 'AUTO')
    include_debug = body.get('includeDebug', False)
    saved_config = body.get('saved_config')

    # If sliderConfig is provided in v40 format, use Universal Prompt Assembler
    if slider_config and any(slider_config.values()):
        from services.universal_prompt_assembler import assemble_prompt
        import random
        
        # Normalize slider config structure
        normalized_config = {
            "photoscaler": slider_config.get('photoscaler', {}),
            "stylescaler": slider_config.get('stylescaler', {}),
            "lightscaler": slider_config.get('lightscaler', {})
        }
        
        # ============================================================
        # 🧠 SMART MODE SWITCH - Detector de Aburrimiento vs. Diversión
        # ============================================================
        def determine_generation_config(sliders: dict, saved_seed: int = None):
            """
            Detecta automáticamente si el usuario quiere:
            - FORENSIC: Restauración (solo limpieza, nitidez)
            - SHOWMAN: Creatividad (ropa, fondo, iluminación dramática)
            """
            style = sliders.get('stylescaler', {})
            light = sliders.get('lightscaler', {})
            
            # Lista de sliders "creativos" - Si tocan esto, quieren MAGIA
            creative_triggers = [
                style.get('styling_ropa', 0),       # s3 - Ropa
                style.get('limpieza_entorno', 0),   # s5 - Fondo/Entorno
                style.get('styling_pelo', 0),       # s2 - Pelo
                style.get('look_cine', 0),          # s8 - Color Grading
                light.get('key_light', 0),          # L1 - Luz Principal
                light.get('estilo_autor', 0),       # L8 - Estilo Autor
                style.get('atmosfera', 0),          # s7 - Atmósfera
                style.get('reencuadre_ia', 0),      # s6 - Reencuadre
            ]
            
            # ¿Ha tocado algo creativo por encima del nivel 3?
            is_creative_mode = any(val > 3 for val in creative_triggers if val)
            
            if is_creative_mode:
                # 🔥 MODO "SHOWMAN" (Resultados Chulos)
                # Alta temperatura para texturas increíbles, luces dramáticas
                return {
                    "mode": "SHOWMAN",
                    "temperature": 0.75,      # Libertad creativa
                    "topP": 0.9,              # Vocabulario rico
                    "topK": 40,               # Variedad de opciones
                    "seed": saved_seed if saved_seed else random.randint(100000000, 999999999)
                }
            else:
                # 🛡️ MODO "FORENSE" (Restauración)
                # Baja temperatura para arreglar sin cambiar la cara
                return {
                    "mode": "FORENSIC",
                    "temperature": 0.1,       # Seguridad máxima
                    "topP": 0.1,              # Camino lógico
                    "topK": 1,                # Cero invención
                    "seed": 42                # Siempre igual (estabilidad)
                }
        
        # Determinar configuración automáticamente o usar saved_config
        if saved_config and saved_config.get('seed'):
            # Usuario aplicando un preset guardado - usar su config exacta
            gen_config = {
                "mode": "PRESET",
                "temperature": saved_config.get('temperature', 0.75),
                "topP": saved_config.get('topP', 0.9),
                "topK": saved_config.get('topK', 40),
                "seed": saved_config.get('seed')
            }
            print(f"[SmartSwitch] PRESET MODE - Seed: {gen_config['seed']}, Temp: {gen_config['temperature']}")
        elif mode == 'FORENSIC':
            # Usuario forzó modo forense
            gen_config = determine_generation_config({}, None)
            gen_config["mode"] = "FORENSIC"
            print(f"[SmartSwitch] FORCED FORENSIC - Temp: {gen_config['temperature']}")
        elif mode == 'CREATIVE' or mode == 'SHOWMAN':
            # Usuario forzó modo creativo
            gen_config = {
                "mode": "SHOWMAN",
                "temperature": 0.75,
                "topP": 0.9,
                "topK": 40,
                "seed": random.randint(100000000, 999999999)
            }
            print(f"[SmartSwitch] FORCED SHOWMAN - Seed: {gen_config['seed']}")
        else:
            # AUTO - Detectar automáticamente basado en sliders
            gen_config = determine_generation_config(normalized_config, None)
            print(f"[SmartSwitch] AUTO -> {gen_config['mode']} - Temp: {gen_config['temperature']}, Seed: {gen_config['seed']}")
        
        # Assemble the Universal Prompt v40.1
        assembly_result = assemble_prompt(normalized_config, include_debug=True)
        compiled_prompt = assembly_result.get('prompt', '')
        debug_info = assembly_result.get('debug', {})
        
        if not compiled_prompt:
            return {"success": False, "error": "Prompt assembly failed"}
        
        # ============================================================
        # 🔥 THE DICTATOR PROMPT - Inyección para consistencia de estilo
        # ============================================================
        style_lock_injected = False
        if saved_config and saved_config.get('style_lock_prompt'):
            # PRESET MODE con Dictator Prompt - Inyectar AL FINAL para máximo peso (Recency Bias)
            compiled_prompt += f"\n\n{saved_config['style_lock_prompt']}"
            style_lock_injected = True
            print(f"[DictatorPrompt] Style Lock injected for PRESET mode")
        
        return {
            "success": True,
            "prompt_text": compiled_prompt,
            "config": {
                "temperature": gen_config["temperature"],
                "topK": gen_config["topK"],
                "topP": gen_config["topP"],
                "maxOutputTokens": 8192,
                "seed": gen_config["seed"]
            },
            "version": "v40.1",
            "metadata": {
                "template": "universal_v40_smart",
                "mode": gen_config["mode"],
                "auto_detected": mode == 'AUTO',
                "active_sliders": debug_info.get('active_sliders', 0),
                "levels_used": debug_info.get('levels_used', {}),
                "identity_lock": True,
                "creative_triggers_detected": gen_config["mode"] == "SHOWMAN",
                "style_lock_injected": style_lock_injected
            }
        }

    # Legacy format: use prompt_compiler
    result = await prompt_compiler.compile_prompt(
        slider_config, 
        vision_analysis,
        profile_type=profile_type
    )
    
    if not result['success']:
        return {"success": False, "error": result.get('error', 'Compilation failed')}
    
    response = {
        "success": True,
        "prompt": result['compiled_prompt'],
        "prompt_text": result['compiled_prompt'],  # Also include as prompt_text for v40 compatibility
        "metadata": result['metadata']
    }
    
    # Include debug info if requested
    if include_debug:
        response['debug_info'] = result.get('debug_info', {})
        response['tokens_estimate'] = result.get('tokens_estimate', {})
        response['dna_anchor'] = result.get('dna_anchor')
    
    return response


@router.post("/generate-image")
async def generate_image_endpoint(body: dict = Body(...)):
    """
    Generate image using Universal Prompt Assembler v37.0.
    
    Expected body:
    {
        "imageUrl": "https://..." or "data:image/...",
        "sliderConfig": {
            "photoscaler": {"limpieza_artefactos": 8, "geometria": 5, ...},
            "stylescaler": {"styling_piel": 6, ...},
            "lightscaler": {"key_light": 7, ...}
        },
        "userMode": "auto|user|pro|prolux",
        "includeDebug": false
    }
    
    The slider values (0-10) are mapped to levels:
    - 0 = OFF
    - 1-3 = LOW  
    - 4-6 = MED
    - 7-9 = HIGH
    - 10 = FORCE
    
    Each slider injects its corresponding instruction from slider_definitions_v29.
    """
    image_url = body.get('imageUrl')
    slider_config = body.get('sliderConfig', {})
    user_mode = body.get('userMode', 'auto')
    include_debug = body.get('includeDebug', False)
    
    # Also support legacy format with compiledPrompt or prompt_text (from Edge Functions)
    compiled_prompt = body.get('compiledPrompt') or body.get('prompt_text')
    debug_info = None  # Initialize debug_info
    
    if not image_url:
        return {"success": False, "error": "No image provided (imageUrl required)"}
    
    # If sliderConfig provided, use Universal Prompt Assembler
    if slider_config and not compiled_prompt:
        # Normalize slider config structure
        normalized_config = {
            "photoscaler": slider_config.get('photoscaler', {}),
            "stylescaler": slider_config.get('stylescaler', {}),
            "lightscaler": slider_config.get('lightscaler', {})
        }
        
        # Handle flat config format (backwards compatibility)
        if not any(normalized_config.values()) and slider_config:
            # Assume flat format, try to categorize sliders
            from services.slider_definitions_service import get_slider_by_key
            for key, value in slider_config.items():
                if isinstance(value, (int, float)):
                    slider_info = get_slider_by_key(key)
                    if slider_info:
                        pilar = slider_info.get('pilar', '').lower()
                        if pilar in normalized_config:
                            normalized_config[pilar][key] = int(value)
        
        # Assemble the Universal Prompt v37.0
        assembly_result = assemble_prompt(normalized_config, include_debug=include_debug)
        compiled_prompt = assembly_result.get('prompt', '')
        
        # Get debug info if requested
        debug_info = assembly_result.get('debug') if include_debug else None
    
    if not compiled_prompt:
        return {"success": False, "error": "No slider configuration or compiled prompt provided"}

    # Model selection based on user mode
    model_name = 'gemini-2.5-flash-image'
    if user_mode in ('pro', 'prolux'):
        model_name = 'gemini-3-pro-image-preview'

    # Generate with Gemini
    result = await gemini_service.generate_content(
        model_name,
        compiled_prompt,
        "",  # user_input_text
        image_url
    )

    if result.get('error'):
        return {"success": False, "error": result['error']}

    response = {
        "success": True,
        "output": {
            "text": result.get('text', ''),
            "image": result.get('image_base64'),
            "hasWatermark": True,
        },
        "metadata": {
            "model_used": result.get('model', model_name),
            "prompt_version": "v37.0",
            "tokens_consumed": 0,
            "tokens_charged": 0,
            "output_type": body.get('outputType', 'preview_watermark'),
        }
    }
    
    # Include compiled prompt and debug in response if requested
    if include_debug:
        response["debug"] = {
            "compiled_prompt": compiled_prompt,  # Full prompt, no truncation
            "slider_debug": debug_info,
            "prompt_length": len(compiled_prompt),
            "estimated_tokens": len(compiled_prompt) // 4
        }
    
    return response


@router.post("/generate")
async def generate(body: dict = Body(...)):
    """
    Legacy generate endpoint - still supported for backwards compatibility.
    """
    user_id = body.get('userId')
    input_data = body.get('input', {})
    user_input_text = input_data.get('content', '')
    image_url = input_data.get('imageUrl')
    analysis_result = body.get('analysisResult')
    
    user_profile = await supabase_db.get_slider_config(user_id)
    if not user_profile: 
        raise HTTPException(status_code=404, detail="User profile not found")
    
    config = user_profile.get('current_config')
    if not config: 
        from data.snippets import get_default_pillars_config
        config = get_default_pillars_config()
        
    user_mode = user_profile.get('user_mode', 'user')

    if not analysis_result and image_url:
        analysis_result = await vision_service.analyze_image(image_url)

    # Model Selection Logic
    model_name = 'gemini-2.5-flash-image'
    if user_mode == 'pro':
        model_name = 'gemini-3-pro-image-preview'
    elif user_mode == 'prolux':
        model_name = 'gemini-3-pro-image-preview'
        
    # Build Prompt using new compiler
    master_prompt = await prompt_compiler.compile_prompt(config, analysis_result)
    
    # Generate
    result = await gemini_service.generate_content(model_name, master_prompt, user_input_text, image_url)
    
    # Log
    log_entry = {
        "user_id": user_id,
        "model_used": result.get("model", model_name),
        "master_prompt": master_prompt[:500],  # Truncate for storage
        "input": input_data,
        "output_text": result.get("text"),
        "has_image": bool(result.get("image_base64")),
        "timestamp": datetime.datetime.now()
    }
    await supabase_db.log_job(log_entry)
    
    return {
        "success": True,
        "output": {
            "text": result.get("text", ""),
            "image": result.get("image_base64"),
            "analysis": analysis_result
        },
        "metadata": {
            "modelUsed": result.get("model", model_name),
            "universalPrompt": True
        }
    }


# Macro endpoints
@router.post("/apply-user-macro")
async def apply_user_macro_endpoint(body: dict = Body(...)):
    user_id = body.get('userId')
    quality = body.get('quality', 5)
    aesthetics = body.get('aesthetics', 5)
    light = body.get('light', 5)
    
    config = await supabase_db.get_slider_config(user_id)
    if not config: 
        return {"success": False}
    
    current_state = config.get('current_config')
    if not current_state:
        from data.snippets import get_default_pillars_config
        current_state = get_default_pillars_config()
    
    new_config = apply_user_macro(current_state, quality, aesthetics, light)
    await supabase_db.update_user_config(user_id, new_config)
    
    return {"success": True, "config": new_config}


@router.post("/apply-pro-macro")
async def apply_pro_macro_endpoint(body: dict = Body(...)):
    user_id = body.get('userId')
    macro_key = body.get('macroKey')
    
    config = await supabase_db.get_slider_config(user_id)
    if not config: 
        return {"success": False}
    
    current_state = config.get('current_config')
    if not current_state:
        from data.snippets import get_default_pillars_config
        current_state = get_default_pillars_config()

    new_config = apply_pro_macro(current_state, macro_key)
    await supabase_db.update_user_config(user_id, new_config)
    
    return {"success": True, "config": new_config}

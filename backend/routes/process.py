from fastapi import APIRouter, HTTPException, Body
from services.supabase_service import supabase_db
from services.gemini_service import gemini_service
from services.vision_service import vision_service
from services.prompt_compiler_service import prompt_compiler
from services.input_normalizer import input_normalizer
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
    FastAPI fallback endpoint matching the v28 Edge Function `prompt-compiler` contract.
    """
    config = body.get('config') or {}
    vision_analysis = body.get('visionAnalysis')

    # Use new compile_with_metadata for full response
    result = await prompt_compiler.compile_with_metadata(config, vision_analysis)
    
    if not result['success']:
        return {"success": False, "error": result.get('error', 'Compilation failed')}
    
    return {
        "success": True,
        "prompt": result['prompt'],
        "metadata": result['metadata']
    }


@router.post("/generate-image")
async def generate_image_endpoint(body: dict = Body(...)):
    """
    FastAPI fallback endpoint matching the v28 Edge Function `generate-image` contract.
    """
    image_url = body.get('imageUrl')
    compiled_prompt = body.get('compiledPrompt', '')
    user_mode = body.get('userMode', 'auto')
    aspect_ratio = body.get('aspectRatio')  # Can be passed from frontend

    # Model selection aligned with existing FastAPI generator
    model_name = 'gemini-2.5-flash-image'
    if user_mode in ('pro', 'prolux'):
        model_name = 'gemini-3-pro-image-preview'

    result = await gemini_service.generate_content(
        model_name,
        compiled_prompt,
        "",  # user_input_text
        image_url
    )

    if result.get('error'):
        return {"success": False, "error": result['error']}

    return {
        "success": True,
        "output": {
            "text": result.get('text', ''),
            "image": result.get('image_base64'),
            "hasWatermark": True,
        },
        "metadata": {
            "model_used": result.get('model', model_name),
            "tokens_consumed": 0,
            "tokens_charged": 0,
            "output_type": body.get('outputType', 'preview_watermark'),
        }
    }


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

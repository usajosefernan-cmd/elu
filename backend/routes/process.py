from fastapi import APIRouter, HTTPException, Body
from server import db
from services.gemini_service import gemini_service
from services.vision_service import vision_service
from services.prompt_factory import build_universal_prompt
from data.macro_mappings import apply_user_macro, apply_pro_macro
from data.snippets import SNIPPET_DICTIONARY, map_value_to_level
import datetime

router = APIRouter(prefix="/process", tags=["process"])

@router.post("/analyze")
async def analyze_input(body: dict = Body(...)):
    image_url = body.get('imageUrl')
    if not image_url: return {"success": False, "message": "No image URL provided"}
    analysis = await vision_service.analyze_image(image_url)
    return {"success": True, "analysis": analysis}

@router.post("/generate")
async def generate(body: dict = Body(...)):
    user_id = body.get('userId')
    input_data = body.get('input', {})
    user_input_text = input_data.get('content', '')
    image_url = input_data.get('imageUrl')
    analysis_result = body.get('analysisResult')
    
    config = await db.pillars_config.find_one({"user_id": user_id})
    if not config: raise HTTPException(status_code=404, detail="Config not found")
        
    user_mode = config.get('user_mode', 'user')

    if not analysis_result and image_url:
        analysis_result = await vision_service.analyze_image(image_url)

    # Model Selection Logic
    model_name = 'gemini-2.5-flash-image'
    if user_mode == 'pro':
        model_name = 'gemini-3-pro-image-preview'
    elif user_mode == 'prolux':
        model_name = 'gemini-3-pro-image-preview'
        
    # Build Prompt
    master_prompt = build_universal_prompt(config, analysis_result)
    
    # Generate (Now supporting Image Return)
    result = await gemini_service.generate_content(model_name, master_prompt, user_input_text, image_url)
    
    # Log
    log_entry = {
        "user_id": user_id,
        "model_used": result.get("model", model_name),
        "master_prompt": master_prompt,
        "input": input_data,
        "output_text": result.get("text"),
        "has_image": bool(result.get("image_base64")),
        "timestamp": datetime.datetime.now()
    }
    await db.process_logs.insert_one(log_entry)
    
    return {
        "success": True,
        "output": {
            "text": result.get("text", ""),
            "image": result.get("image_base64"), # Pass base64 image to frontend
            "analysis": analysis_result
        },
        "metadata": {
            "modelUsed": result.get("model", model_name),
            "universalPrompt": True
        }
    }

# Keep existing macro endpoints...
@router.post("/apply-user-macro")
async def apply_user_macro_endpoint(body: dict = Body(...)):
    user_id = body.get('userId')
    quality = body.get('quality', 5)
    aesthetics = body.get('aesthetics', 5)
    light = body.get('light', 5)
    
    config = await db.pillars_config.find_one({"user_id": user_id}, {"_id": 0})
    if not config: return {"success": False}
    
    new_config = apply_user_macro(config, quality, aesthetics, light)
    
    for pillar_name in ['photoscaler', 'stylescaler', 'lightscaler']:
        for s in new_config[pillar_name]['sliders']:
            val = s['value']
            s['snippet'] = SNIPPET_DICTIONARY[pillar_name][s['name']][val]
            s['levelText'] = map_value_to_level(val)
            
    await db.pillars_config.replace_one({"user_id": user_id}, new_config)
    return {"success": True, "config": new_config}

@router.post("/apply-pro-macro")
async def apply_pro_macro_endpoint(body: dict = Body(...)):
    user_id = body.get('userId')
    macro_key = body.get('macroKey')
    
    config = await db.pillars_config.find_one({"user_id": user_id}, {"_id": 0})
    if not config: return {"success": False}
    
    new_config = apply_pro_macro(config, macro_key)
    
    for pillar_name in ['photoscaler', 'stylescaler', 'lightscaler']:
        if pillar_name in new_config:
            for s in new_config[pillar_name]['sliders']:
                val = s['value']
                s['snippet'] = SNIPPET_DICTIONARY[pillar_name][s['name']][val]
                s['levelText'] = map_value_to_level(val)

    await db.pillars_config.replace_one({"user_id": user_id}, new_config)
    return {"success": True, "config": new_config}

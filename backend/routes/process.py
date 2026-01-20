from fastapi import APIRouter, HTTPException, Body
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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
    """
    Step 1: Analyze image with Vision Service (Gemini 2.5 Flash).
    Returns analysis for user confirmation (Pro/Prolux) or internal use (User).
    """
    image_url = body.get('imageUrl')
    if not image_url:
         return {"success": False, "message": "No image URL provided"}
         
    analysis = await vision_service.analyze_image(image_url)
    
    return {
        "success": True,
        "analysis": analysis
    }

@router.post("/generate")
async def generate(body: dict = Body(...)):
    user_id = body.get('userId')
    input_data = body.get('input', {})
    user_input_text = input_data.get('content', '')
    image_url = input_data.get('imageUrl')
    analysis_result = body.get('analysisResult') # Optional, if passed from frontend confirmation
    
    # 1. Get Config
    config = await db.pillars_config.find_one({"user_id": user_id})
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
        
    user_mode = config.get('user_mode', 'user')

    # 2. AUTO-ANALYSIS if not provided and not skipped
    # User mode: Auto analyze invisible to user
    # Pro/Prolux: Frontend should have called /analyze first, but if not we do it here.
    if not analysis_result and image_url:
        analysis_result = await vision_service.analyze_image(image_url)

    # 3. Model Selection
    model_name = 'gemini-2.5-flash'
    if user_mode == 'pro':
        model_name = 'gemini' # Standard
    elif user_mode == 'prolux':
        model_name = 'gemini-3-pro'
        
    # 4. Build Universal Prompt
    master_prompt = build_universal_prompt(config, analysis_result)
    
    # 5. Generate
    # We pass the image_url to generation as well if it's an image task
    # For now assuming text-to-text or text+image-to-text instructions. 
    # Real image generation/edit needs an Image Generation/Edit model or multimodal capability.
    # Given "Processing intelligent... Gemini", it implies Text/Multimodal processing describing the output or controlling a pipeline.
    # If the output IS an image, we would need an Image Gen model.
    # PRD "Propósito y Alcance" implies "Procesamiento inteligente". 
    # If it's pure text output describing the process: OK.
    # If it's Image-to-Image: Gemini 3 Pro is Multimodal but output is text/code usually, unless using Imagen 3?
    # PRD Section 2 says "Solo 3 modelos IA: Gemini...". 
    # We will assume we are generating the *Instruction* or the *Result* text for now. 
    # If Image Generation is needed, we would need Imagen. 
    # But let's stick to the prompt text generation as per "Ensamblaje del Prompt Maestro".
    
    final_input = f"USER REQUEST: {user_input_text}\nIMAGE URL: {image_url}"
    
    result_text = await gemini_service.generate_content(model_name, master_prompt, final_input)
    
    # 6. Log
    log_entry = {
        "user_id": user_id,
        "model_used": model_name,
        "master_prompt": master_prompt,
        "input": input_data,
        "output": result_text,
        "analysis": analysis_result,
        "timestamp": datetime.datetime.now()
    }
    await db.process_logs.insert_one(log_entry)
    
    return {
        "success": True,
        "output": {
            "text": result_text,
            "analysis": analysis_result
        },
        "metadata": {
            "modelUsed": model_name,
            "universalPrompt": True
        }
    }

@router.post("/apply-user-macro")
async def apply_user_macro_endpoint(body: dict = Body(...)):
    user_id = body.get('userId')
    quality = body.get('quality', 5)
    aesthetics = body.get('aesthetics', 5)
    light = body.get('light', 5)
    
    config = await db.pillars_config.find_one({"user_id": user_id})
    if not config: return {"success": False}
    
    new_config = apply_user_macro(config, quality, aesthetics, light)
    
    # Need to update snippets/levels for all modified sliders
    # Simplified loop to refresh snippets based on new values
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
    
    config = await db.pillars_config.find_one({"user_id": user_id})
    if not config: return {"success": False}
    
    new_config = apply_pro_macro(config, macro_key)
    
    # Refresh snippets
    for pillar_name in ['photoscaler', 'stylescaler', 'lightscaler']:
        if pillar_name in new_config:
            for s in new_config[pillar_name]['sliders']:
                val = s['value']
                s['snippet'] = SNIPPET_DICTIONARY[pillar_name][s['name']][val]
                s['levelText'] = map_value_to_level(val)

    await db.pillars_config.replace_one({"user_id": user_id}, new_config)
    return {"success": True, "config": new_config}

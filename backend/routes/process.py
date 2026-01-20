from fastapi import APIRouter, HTTPException, Body
from services.supabase_service import supabase_db
from services.gemini_service import gemini_service
from services.vision_service import vision_service
from services.prompt_compiler_service import prompt_compiler
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
    
    # config = await db.pillars_config.find_one({"user_id": user_id})
    user_profile = await supabase_db.get_slider_config(user_id)
    if not user_profile: raise HTTPException(status_code=404, detail="User profile not found")
    
    config = user_profile.get('current_config')
    if not config: 
        # Generate default config if not present
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
        
    # Build Prompt
    # master_prompt = build_universal_prompt(config, analysis_result)
    master_prompt = await prompt_compiler.compile_prompt(config, analysis_result)
    
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
    # await db.process_logs.insert_one(log_entry)
    await supabase_db.log_job(log_entry)
    
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
    
    # config = await db.pillars_config.find_one({"user_id": user_id}, {"_id": 0})
    # For now, macro endpoints also need supabase config if we are storing config in DB
    # But since Supabase 'user_profiles' doesn't store the full slider config yet, we might have issues.
    # TEMPORARY: Keep using mongo for slider state until we create a 'user_config' table or column in Supabase.
    # The 'user_profiles' table only has mode.
    # We need to fetch defaults if not present.
    
    config = await supabase_db.get_slider_config(user_id) # This currently returns user profile
    # If we need the actual slider values (json), we need to add a column for it in 'user_profiles' or a separate table.
    # The v28 schema has 'user_presets' but not a 'current_state'.
    # I will assume we add 'current_config' JSONB to 'user_profiles' for state persistence.
    
    if not config: return {"success": False}
    current_state = config.get('current_config')
    
    if not current_state:
         # Generate default state (This logic needs to be robust)
         from data.snippets import get_default_pillars_config
         current_state = get_default_pillars_config()
    
    new_config = apply_user_macro(current_state, quality, aesthetics, light)
    
    # Update Supabase
    await supabase_db.update_user_config(user_id, new_config)
    
    return {"success": True, "config": new_config}

@router.post("/apply-pro-macro")
async def apply_pro_macro_endpoint(body: dict = Body(...)):
    user_id = body.get('userId')
    macro_key = body.get('macroKey')
    
    # config = await db.pillars_config.find_one({"user_id": user_id}, {"_id": 0})
    config = await supabase_db.get_slider_config(user_id)
    if not config: return {"success": False}
    
    current_state = config.get('current_config')
    if not current_state:
         from data.snippets import get_default_pillars_config
         current_state = get_default_pillars_config()

    new_config = apply_pro_macro(current_state, macro_key)
    
    # Update Supabase
    await supabase_db.update_user_config(user_id, new_config)
    
    return {"success": True, "config": new_config}

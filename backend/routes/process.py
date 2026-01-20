from fastapi import APIRouter, HTTPException, Body
from server import db
from services.gemini_service import gemini_service
import datetime

router = APIRouter(prefix="/process", tags=["process"])

def build_master_prompt(config: dict) -> str:
    prompt = "You are an advanced image processing AI using Gemini. Based on the following configuration, analyze and process the user request.\n\n"
    
    pillars = ['photoscaler', 'stylescaler', 'lightscaler']
    
    for p_name in pillars:
        p_data = config.get(p_name)
        if p_data and p_data['mode'] == 'auto':
            prompt += f"{p_name.upper()}:\n"
            for slider in p_data['sliders']:
                prompt += f"- {slider['name']}: {slider['snippet']}\n"
            prompt += "\n"
            
    return prompt

@router.post("/generate")
async def generate(body: dict = Body(...)):
    user_id = body.get('userId')
    user_input = body.get('input', {}).get('content', '')
    
    # 1. Obtener config
    config = await db.pillars_config.find_one({"user_id": user_id})
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
        
    # 2. Determinar modelo
    user_mode = config.get('user_mode', 'user')
    model_name = 'gemini-2.5-flash'
    if user_mode == 'pro':
        model_name = 'gemini'
    elif user_mode == 'prolux':
        model_name = 'gemini-3-pro'
        
    # 3. Construir prompt
    master_prompt = build_master_prompt(config)
    
    # 4. Llamar a Gemini
    result_text = await gemini_service.generate_content(model_name, master_prompt, user_input)
    
    # 5. Log
    log_entry = {
        "user_id": user_id,
        "model_used": model_name,
        "master_prompt": master_prompt,
        "input": user_input,
        "output": result_text,
        "timestamp": datetime.datetime.now()
    }
    await db.process_logs.insert_one(log_entry)
    
    return {
        "success": True,
        "output": {
            "text": result_text
        },
        "metadata": {
            "modelUsed": model_name
        }
    }

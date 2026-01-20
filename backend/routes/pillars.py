from fastapi import APIRouter, HTTPException, Body
from server import db
from data.snippets import SNIPPET_DICTIONARY, map_value_to_level
from data.ui_meta import UI_META

router = APIRouter(prefix="/pillars", tags=["pillars"])

@router.get("/config")
async def get_config(userId: str):
    config = await db.pillars_config.find_one({"user_id": userId}, {"_id": 0})
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Enrich config with UI Metadata
    for p_name in ['photoscaler', 'stylescaler', 'lightscaler']:
        if p_name in config:
            for slider in config[p_name]['sliders']:
                s_name = slider['name']
                if s_name in UI_META[p_name]:
                    slider['label'] = UI_META[p_name][s_name]['label']
                    slider['description'] = UI_META[p_name][s_name]['description']
    
    return config

@router.post("/slider-update")
async def update_slider(body: dict = Body(...)):
    user_id = body.get('userId')
    pillar_name = body.get('pilarName')
    slider_name = body.get('sliderName')
    value = body.get('value')
    
    if value < 0 or value > 10:
        raise HTTPException(status_code=400, detail="Value must be between 0 and 10")
        
    # Obtener snippet
    try:
        snippet = SNIPPET_DICTIONARY[pillar_name][slider_name][value]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid slider or pillar name")
        
    level_text = map_value_to_level(value)
    
    # Actualizar en BD (usando dot notation de MongoDB para JSON anidado es complejo con arrays)
    # Estrategia: Leer, Modificar en memoria, Guardar.
    
    config = await db.pillars_config.find_one({"user_id": user_id})
    if not config:
         raise HTTPException(status_code=404, detail="User config not found")
         
    # Encontrar el slider en la lista
    pillar = config[pillar_name]
    found = False
    for s in pillar['sliders']:
        if s['name'] == slider_name:
            s['value'] = value
            s['levelText'] = level_text
            s['snippet'] = snippet
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Slider not found in config")
        
    await db.pillars_config.update_one(
        {"user_id": user_id},
        {"$set": {pillar_name: pillar}}
    )
    
    return {
        "success": True,
        "updated": {
            "pilarName": pillar_name,
            "sliderName": slider_name,
            "value": value,
            "levelText": level_text,
            "snippet": snippet
        }
    }

@router.post("/toggle")
async def toggle_pillar(body: dict = Body(...)):
    user_id = body.get('userId')
    pillar_name = body.get('pilarName')
    mode = body.get('mode') # 'auto' or 'off'
    
    if mode not in ['auto', 'off']:
         raise HTTPException(status_code=400, detail="Invalid mode")
         
    await db.pillars_config.update_one(
        {"user_id": user_id},
        {"$set": {f"{pillar_name}.mode": mode}}
    )
    
    return {
        "success": True,
        "updated": {
            "pilarName": pillar_name,
            "mode": mode
        }
    }

@router.post("/update-user-mode")
async def update_user_mode(body: dict = Body(...)):
    user_id = body.get('userId')
    mode = body.get('mode') # 'user', 'pro', 'prolux'
    
    if mode not in ['user', 'pro', 'prolux']:
        raise HTTPException(status_code=400, detail="Invalid user mode")
        
    await db.user_profiles.update_one({"id": user_id}, {"$set": {"user_mode": mode}})
    await db.pillars_config.update_one({"user_id": user_id}, {"$set": {"user_mode": mode}})
    
    return {"success": True, "mode": mode}

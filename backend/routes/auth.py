from fastapi import APIRouter, HTTPException, Body
from models import LoginRequest, UserProfile
from server import db
from data.snippets import get_default_pillars_config

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login(data: LoginRequest = Body(...)):
    # Simulación de login. Si no existe, lo crea (para prototipo rápido).
    user = await db.user_profiles.find_one({"email": data.email})
    
    if not user:
        # Registro implícito
        new_user = UserProfile(email=data.email, password=data.password, user_mode='user')
        await db.user_profiles.insert_one(new_user.model_dump())
        
        # Crear config inicial de pilares
        pillars_data = get_default_pillars_config()
        pillars_config = {
            "user_id": new_user.id,
            "user_mode": new_user.user_mode,
            "photoscaler": pillars_data['photoscaler'],
            "stylescaler": pillars_data['stylescaler'],
            "lightscaler": pillars_data['lightscaler'],
            "updated_at": new_user.created_at
        }
        await db.pillars_config.insert_one(pillars_config)
        
        return {
            "success": True, 
            "userId": new_user.id, 
            "mode": new_user.user_mode, 
            "message": "User created"
        }
    
    if user['password'] != data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    return {
        "success": True, 
        "userId": user['id'], 
        "mode": user['user_mode'],
        "message": "Login successful"
    }

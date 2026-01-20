from fastapi import APIRouter, Body, HTTPException
from services.supabase_service import supabase_db

router = APIRouter(prefix="/admin-actions", tags=["admin"])

@router.post("")
async def admin_actions(body: dict = Body(...)):
    action = body.get('action')
    payload = body.get('payload', {})
    
    print(f"Admin Action: {action}")
    
    if action == 'get_dashboard_stats':
        # Mock stats until DB is populated
        return {
            "stats": {
                "users": 150,
                "generations": 1240,
                "variations": 3500,
                "waitlist": 45,
                "total_cost": 12.50
            }
        }
        
    elif action == 'get_generations_log':
        # Mock log
        return {
            "data": [
                { "id": "gen-1", "created_at": "2026-01-20T10:00:00Z", "prompt": "Cyberpunk City", "status": "completed", "user_email": "demo@user.com" },
                { "id": "gen-2", "created_at": "2026-01-20T11:30:00Z", "prompt": "Portrait Restoration", "status": "completed", "user_email": "admin@luxscaler.com" }
            ],
            "count": 2
        }
        
    elif action == 'get_session_details':
        return {"data": null} # Empty for now

    return {"success": True}

from fastapi import APIRouter
from services.supabase_service import supabase_db

router = APIRouter(prefix="/slider-definitions", tags=["slider-definitions"])


@router.get("")
async def get_all_slider_definitions():
    """Obtiene todas las definiciones de sliders desde Supabase"""
    try:
        response = supabase_db.client.table('slider_definitions')\
            .select('*')\
            .execute()
        
        return {
            "success": True,
            "definitions": response.data or []
        }
        
    except Exception as e:
        print(f"[SliderDefinitions] Error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/{slider_key}")
async def get_slider_definition(slider_key: str):
    """Obtiene definición de un slider específico"""
    try:
        response = supabase_db.client.table('slider_definitions')\
            .select('*')\
            .eq('slider_key', slider_key)\
            .single()\
            .execute()
        
        if response.data:
            return {
                "success": True,
                "definition": response.data
            }
        else:
            return {"success": False, "error": "Slider not found"}
        
    except Exception as e:
        print(f"[SliderDefinition] Error: {e}")
        return {"success": False, "error": str(e)}

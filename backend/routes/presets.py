from fastapi import APIRouter
from services.smart_presets_service import smart_presets_service

router = APIRouter(prefix="/presets", tags=["presets"])


@router.get("/system")
async def get_system_presets():
    """Obtiene todos los presets del sistema."""
    presets = smart_presets_service.get_system_presets()
    return {"success": True, "presets": presets}


@router.get("/user/{user_id}")
async def get_user_presets(user_id: str):
    """Obtiene los presets personalizados de un usuario."""
    presets = await smart_presets_service.get_user_presets(user_id)
    return {"success": True, "presets": presets}


@router.post("/user/{user_id}")
async def save_user_preset(user_id: str, body: dict):
    """Guarda un nuevo preset para el usuario."""
    result = await smart_presets_service.save_user_preset(
        user_id=user_id,
        name=body.get('name', 'My Preset'),
        slider_values=body.get('slider_values', {}),
        locked_pillars=body.get('locked_pillars', []),
        narrative_anchor=body.get('narrative_anchor')
    )
    
    if result:
        return {"success": True, "preset": result}
    return {"success": False, "error": "Failed to save preset"}


@router.delete("/user/{user_id}/{preset_id}")
async def delete_user_preset(user_id: str, preset_id: str):
    """Elimina un preset del usuario."""
    success = await smart_presets_service.delete_user_preset(user_id, preset_id)
    return {"success": success}


@router.get("/{preset_id}")
async def get_preset_by_id(preset_id: str):
    """Obtiene un preset por ID."""
    preset = smart_presets_service.get_preset_by_id(preset_id)
    if preset:
        return {"success": True, "preset": preset.to_dict()}
    return {"success": False, "error": "Preset not found"}


@router.post("/blend")
async def blend_preset_with_auto(body: dict):
    """Mezcla un preset con configuración AUTO."""
    preset_id = body.get('preset_id')
    auto_settings = body.get('auto_settings', {})
    blend_factor = body.get('blend_factor', 0.5)
    
    preset = smart_presets_service.get_preset_by_id(preset_id)
    if not preset:
        return {"success": False, "error": "Preset not found"}
    
    result = smart_presets_service.blend_with_auto(preset, auto_settings, blend_factor)
    return {"success": True, "blended_config": result}

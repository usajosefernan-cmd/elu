"""
Slider Definitions API Routes
Exposes slider definitions for frontend consumption.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from services.slider_definitions_service import (
    get_all_slider_definitions,
    get_slider_by_key,
    get_sliders_by_pilar,
    get_level_description,
    get_slider_ui_info,
    get_version
)

router = APIRouter(prefix="/slider-definitions", tags=["Slider Definitions"])


@router.get("/")
async def get_all_definitions() -> Dict:
    """Get all slider definitions with version info."""
    sliders = get_all_slider_definitions()
    return {
        "version": get_version(),
        "count": len(sliders),
        "sliders": sliders
    }


@router.get("/version")
async def get_definitions_version() -> Dict:
    """Get the current version of slider definitions."""
    return {"version": get_version()}


@router.get("/by-pilar/{pilar}")
async def get_definitions_by_pilar(pilar: str) -> Dict:
    """Get slider definitions for a specific pillar (PHOTOSCALER, STYLESCALER, LIGHTSCALER)."""
    valid_pillars = ["PHOTOSCALER", "STYLESCALER", "LIGHTSCALER"]
    pilar_upper = pilar.upper()
    
    if pilar_upper not in valid_pillars:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid pilar. Must be one of: {', '.join(valid_pillars)}"
        )
    
    sliders = get_sliders_by_pilar(pilar_upper)
    return {
        "pilar": pilar_upper,
        "count": len(sliders),
        "sliders": sliders
    }


@router.get("/slider/{key_id}")
async def get_single_slider(key_id: str) -> Dict:
    """Get a specific slider definition by key_id."""
    slider = get_slider_by_key(key_id)
    if not slider:
        raise HTTPException(status_code=404, detail=f"Slider '{key_id}' not found")
    return slider


@router.get("/slider/{key_id}/level/{level}")
async def get_slider_level_description(key_id: str, level: str) -> Dict:
    """Get the description for a specific slider level."""
    valid_levels = ["OFF", "LOW", "MED", "HIGH", "FORCE"]
    level_upper = level.upper()
    
    if level_upper not in valid_levels:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid level. Must be one of: {', '.join(valid_levels)}"
        )
    
    description = get_level_description(key_id, level_upper)
    if description is None:
        raise HTTPException(status_code=404, detail=f"Slider '{key_id}' not found")
    
    return {
        "key_id": key_id,
        "level": level_upper,
        "description": description
    }


@router.get("/ui-info")
async def get_all_ui_info() -> List[Dict]:
    """Get UI display information for all sliders."""
    sliders = get_all_slider_definitions()
    return [
        {
            "id": s.get("id"),
            "key_id": s.get("key_id"),
            "pilar": s.get("pilar"),
            "ui_title": s.get("ui_title"),
            "ui_description": s.get("ui_description")
        }
        for s in sliders
    ]

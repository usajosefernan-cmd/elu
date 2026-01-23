"""
Prompt Assembly API Routes
Exposes the Universal Prompt Assembler for frontend and testing.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, List
from services.universal_prompt_assembler import (
    assemble_prompt,
    assemble_prompt_from_flat,
    get_prompt_preview,
    SLIDER_KEY_TO_PLACEHOLDER
)

router = APIRouter(prefix="/prompt", tags=["Prompt Assembly"])


class SliderConfig(BaseModel):
    """Nested slider configuration by pillar."""
    photoscaler: Optional[Dict[str, int]] = {}
    stylescaler: Optional[Dict[str, int]] = {}
    lightscaler: Optional[Dict[str, int]] = {}


class FlatSliderConfig(BaseModel):
    """Flat slider configuration."""
    sliders: Dict[str, int]


class AssembleRequest(BaseModel):
    """Request body for prompt assembly."""
    config: SliderConfig
    include_debug: Optional[bool] = False


class AssembleFlatRequest(BaseModel):
    """Request body for flat prompt assembly."""
    sliders: Dict[str, int]
    include_debug: Optional[bool] = False


@router.post("/assemble")
async def assemble_system_prompt(request: AssembleRequest) -> Dict:
    """
    Assemble the complete system prompt from nested slider configuration.
    
    Example request:
    {
        "config": {
            "photoscaler": {"limpieza_artefactos": 8, "geometria": 5},
            "stylescaler": {"styling_piel": 6},
            "lightscaler": {"key_light": 7}
        },
        "include_debug": true
    }
    """
    try:
        slider_values = {
            "photoscaler": request.config.photoscaler or {},
            "stylescaler": request.config.stylescaler or {},
            "lightscaler": request.config.lightscaler or {}
        }
        
        result = assemble_prompt(slider_values, request.include_debug)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt assembly failed: {str(e)}")


@router.post("/assemble-flat")
async def assemble_from_flat_config(request: AssembleFlatRequest) -> Dict:
    """
    Assemble the system prompt from a flat dictionary of slider values.
    
    Example request:
    {
        "sliders": {
            "limpieza_artefactos": 8,
            "geometria": 5,
            "key_light": 7
        },
        "include_debug": true
    }
    """
    try:
        result = assemble_prompt_from_flat(request.sliders, request.include_debug)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt assembly failed: {str(e)}")


@router.post("/preview")
async def get_assembly_preview(request: AssembleRequest) -> Dict:
    """
    Get a concise preview of slider instructions without the full template.
    Useful for debugging and UI display.
    """
    try:
        slider_values = {
            "photoscaler": request.config.photoscaler or {},
            "stylescaler": request.config.stylescaler or {},
            "lightscaler": request.config.lightscaler or {}
        }
        
        preview = get_prompt_preview(slider_values)
        return {
            "preview": preview,
            "total_sliders": sum(len(v) for v in slider_values.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview generation failed: {str(e)}")


@router.get("/mappings")
async def get_slider_mappings() -> Dict:
    """
    Get the mapping between slider key_ids and template placeholders.
    Useful for understanding which slider maps to which template variable.
    """
    return {
        "mappings": SLIDER_KEY_TO_PLACEHOLDER,
        "pillars": {
            "PHOTOSCALER": ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"],
            "STYLESCALER": ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"],
            "LIGHTSCALER": ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9"]
        }
    }


@router.get("/template")
async def get_raw_template() -> Dict:
    """
    Get the raw Universal Template v37.0 without any substitutions.
    """
    from services.universal_prompt_assembler import UNIVERSAL_TEMPLATE
    return {
        "version": "v37.0",
        "template": UNIVERSAL_TEMPLATE
    }

"""
Slider Definitions Service v29
Provides access to the complete slider definitions with all level descriptions.
"""
import json
import os
from typing import Dict, List, Optional
from functools import lru_cache

# Path to the slider definitions JSON file
SLIDER_DEFINITIONS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 
    "data", 
    "slider_definitions_v29.json"
)

@lru_cache(maxsize=1)
def load_slider_definitions() -> Dict:
    """Load slider definitions from JSON file (cached)."""
    try:
        with open(SLIDER_DEFINITIONS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: Slider definitions file not found at {SLIDER_DEFINITIONS_PATH}")
        return {"version": "v29", "sliders": []}
    except json.JSONDecodeError as e:
        print(f"Error parsing slider definitions: {e}")
        return {"version": "v29", "sliders": []}


def get_all_slider_definitions() -> List[Dict]:
    """Get all 27 slider definitions."""
    data = load_slider_definitions()
    return data.get("sliders", [])


def get_slider_by_key(key_id: str) -> Optional[Dict]:
    """Get a specific slider definition by its key_id."""
    sliders = get_all_slider_definitions()
    for slider in sliders:
        if slider.get("key_id") == key_id:
            return slider
    return None


def get_sliders_by_pilar(pilar: str) -> List[Dict]:
    """Get all slider definitions for a specific pillar."""
    sliders = get_all_slider_definitions()
    return [s for s in sliders if s.get("pilar", "").upper() == pilar.upper()]


def get_level_description(key_id: str, level: str) -> Optional[str]:
    """
    Get the description for a specific slider level.
    
    Args:
        key_id: The slider key (e.g., 'limpieza_artefactos')
        level: The level name (OFF, LOW, MED, HIGH, FORCE)
    
    Returns:
        The description string or None if not found
    """
    slider = get_slider_by_key(key_id)
    if not slider:
        return None
    
    levels = slider.get("levels", {})
    return levels.get(level.upper())


def get_level_from_value(value: int) -> str:
    """
    Convert a numeric slider value (0-10) to a level name.
    
    Args:
        value: Integer 0-10
    
    Returns:
        Level name: OFF, LOW, MED, HIGH, or FORCE
    """
    if value == 0:
        return "OFF"
    elif 1 <= value <= 3:
        return "LOW"
    elif 4 <= value <= 6:
        return "MED"
    elif 7 <= value <= 9:
        return "HIGH"
    else:  # 10
        return "FORCE"


def get_prompt_snippet_for_slider(key_id: str, value: int) -> Optional[str]:
    """
    Get the prompt snippet for a slider at a specific value.
    
    Args:
        key_id: The slider key
        value: The slider value (0-10)
    
    Returns:
        The corresponding description for that level
    """
    level = get_level_from_value(value)
    return get_level_description(key_id, level)


def build_prompt_from_sliders(slider_values: Dict[str, Dict]) -> Dict[str, List[str]]:
    """
    Build prompt snippets from a complete slider configuration.
    
    Args:
        slider_values: Dict with pillar names as keys, containing slider name-value pairs
                      e.g., {"photoscaler": {"limpieza_artefactos": 8, ...}, ...}
    
    Returns:
        Dict with pillar names as keys, containing lists of prompt snippets
    """
    result = {}
    
    for pilar_name, sliders in slider_values.items():
        snippets = []
        for slider_key, value in sliders.items():
            if isinstance(value, (int, float)):
                snippet = get_prompt_snippet_for_slider(slider_key, int(value))
                if snippet:
                    snippets.append(snippet)
        result[pilar_name] = snippets
    
    return result


def get_slider_ui_info(key_id: str) -> Optional[Dict]:
    """
    Get UI display information for a slider.
    
    Returns:
        Dict with ui_title, ui_description, and pilar
    """
    slider = get_slider_by_key(key_id)
    if not slider:
        return None
    
    return {
        "key_id": slider.get("key_id"),
        "ui_title": slider.get("ui_title"),
        "ui_description": slider.get("ui_description"),
        "pilar": slider.get("pilar")
    }


def get_version() -> str:
    """Get the current version of slider definitions."""
    data = load_slider_definitions()
    return data.get("version", "unknown")


# Pre-load definitions on module import
_definitions = load_slider_definitions()
print(f"Slider Definitions Service loaded: {len(_definitions.get('sliders', []))} sliders, version {_definitions.get('version')}")

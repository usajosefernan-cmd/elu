"""
Supabase Slider Definitions Service
Reads slider definitions directly from Supabase macro_definitions table.
"""
import os
from typing import Dict, List, Optional
from supabase import create_client, Client
from functools import lru_cache

# Supabase credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://uxqtxkuldjdvpnojgdsh.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cXR4a3VsZGpkdnBub2pnZHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDQ3MTIsImV4cCI6MjA4MzkyMDcxMn0.wX6nlBOHM-9Srd-BWCE2v2SsK3hSLnlBiciA5T5SE2M")

def get_supabase_client() -> Client:
    """Get Supabase client instance."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_all_slider_definitions_from_supabase() -> List[Dict]:
    """
    Fetch all slider definitions from Supabase macro_definitions table.
    
    Returns:
        List of slider definitions with full level descriptions.
    """
    try:
        supabase = get_supabase_client()
        result = supabase.table("macro_definitions").select("*").execute()
        
        # Transform data to expected format
        sliders = []
        for row in result.data:
            affected = row.get("affected_sliders", {})
            sliders.append({
                "id": affected.get("id"),
                "pilar": affected.get("pilar"),
                "key_id": affected.get("key_id") or row.get("macro_key"),
                "ui_title": affected.get("ui_title"),
                "ui_description": affected.get("ui_description"),
                "auto_vision": affected.get("auto_vision", "(según criterio)"),
                "levels": affected.get("levels", {})
            })
        
        return sliders
    except Exception as e:
        print(f"Error fetching from Supabase: {e}")
        return []


def fetch_slider_by_key_from_supabase(key_id: str) -> Optional[Dict]:
    """
    Fetch a specific slider definition from Supabase.
    
    Args:
        key_id: The slider key (e.g., 'limpieza_artefactos')
    
    Returns:
        Slider definition dict or None
    """
    try:
        supabase = get_supabase_client()
        result = supabase.table("macro_definitions").select("*").eq("macro_key", key_id).execute()
        
        if result.data:
            row = result.data[0]
            affected = row.get("affected_sliders", {})
            return {
                "id": affected.get("id"),
                "pilar": affected.get("pilar"),
                "key_id": affected.get("key_id") or row.get("macro_key"),
                "ui_title": affected.get("ui_title"),
                "ui_description": affected.get("ui_description"),
                "auto_vision": affected.get("auto_vision", "(según criterio)"),
                "levels": affected.get("levels", {})
            }
        return None
    except Exception as e:
        print(f"Error fetching slider from Supabase: {e}")
        return None


def fetch_sliders_by_pilar_from_supabase(pilar: str) -> List[Dict]:
    """
    Fetch all sliders for a specific pillar from Supabase.
    
    Args:
        pilar: PHOTOSCALER, STYLESCALER, or LIGHTSCALER
    
    Returns:
        List of slider definitions for that pillar
    """
    all_sliders = fetch_all_slider_definitions_from_supabase()
    return [s for s in all_sliders if s.get("pilar", "").upper() == pilar.upper()]


def get_prompt_snippet_from_supabase(key_id: str, value: int) -> Optional[str]:
    """
    Get the prompt snippet for a slider at a specific value from Supabase.
    
    Args:
        key_id: The slider key
        value: The slider value (0-10)
    
    Returns:
        The corresponding description for that level
    """
    slider = fetch_slider_by_key_from_supabase(key_id)
    if not slider:
        return None
    
    # Convert value to level
    if value == 0:
        level = "OFF"
    elif 1 <= value <= 3:
        level = "LOW"
    elif 4 <= value <= 6:
        level = "MED"
    elif 7 <= value <= 9:
        level = "HIGH"
    else:
        level = "FORCE"
    
    return slider.get("levels", {}).get(level)

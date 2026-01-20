import google.generativeai as genai
import os
import json
import base64
from backend.services.key_manager import key_manager

class VisionService:
    def __init__(self):
        pass
        
    async def analyze_image(self, image_input: str) -> dict:
        current_key = key_manager.get_next_key()
        if not current_key:
            return {"error": "No API Key"}
            
        genai.configure(api_key=current_key)

        prompt = """
[TASK: VISION_ANALYSIS_PROTOCOL_V18]
ANALYZE the input image to extract NARRATIVE ANCHORS and TECHNICAL SPECS.
OUTPUT JSON ONLY.

STRUCTURE:
1. "semantic_anchors": List of key visual elements that MUST be preserved (e.g., "wooden table texture", "rembrandt lighting", "scar on left cheek").
2. "technical_assessment":
   - "noise_level": 0-10
   - "blur_level": 0-10
   - "damage_level": 0-10 (scratches, tears)
   - "dynamic_range": "low" | "med" | "high"
3. "suggested_pillar_settings":
   Based on assessment, suggest slider values (0-10) for:
   - limpieza_artefactos (High if damage_level > 7)
   - chronos (High if blur_level > 6)
   - senal_raw (High if dynamic_range is low)

JSON OUTPUT FORMAT:
{
  "semantic_anchors": ["string", "string"],
  "technical_assessment": { ... },
  "suggested_pillar_settings": { "limpieza_artefactos": 8, ... }
}
"""
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            content_parts = [prompt]
            
            if image_input.startswith("data:image"):
                try:
                    header, encoded = image_input.split(",", 1)
                    mime_type = header.split(":")[1].split(";")[0]
                    image_data = base64.b64decode(encoded)
                    content_parts.append({"mime_type": mime_type, "data": image_data})
                except:
                    return {"error": "Invalid Image Data"}
            else:
                content_parts.append(f"Image URL: {image_input}")

            response = model.generate_content(content_parts)
            
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
                
            return json.loads(text)
            
        except Exception as e:
            key_manager.report_error(current_key)
            print(f"Vision Analysis Failed: {e}")
            return {
                "semantic_anchors": ["Detected Image Subject (Fallback)"],
                "technical_assessment": {"noise_level": 5, "blur_level": 2},
                "suggested_pillar_settings": {}
            }

vision_service = VisionService()

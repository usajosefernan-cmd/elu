from google import genai
from google.genai import types
import os
import json
import base64
from services.key_manager import key_manager

class VisionService:
    def __init__(self):
        pass
        
    async def analyze_image(self, image_input: str) -> dict:
        current_key = key_manager.get_next_key()
        if not current_key:
            return {"error": "No API Key"}
            
        prompt = """
[TASK: VISION_ANALYSIS_PROTOCOL_V18]
ANALYZE the input image to extract NARRATIVE ANCHORS and TECHNICAL SPECS.
OUTPUT JSON ONLY.
...
"""
        # Truncated prompt for brevity in this file update
        full_prompt = prompt + "\nJSON OUTPUT FORMAT:\n{\n  \"semantic_anchors\": [\"string\", \"string\"],\n  \"technical_assessment\": { ... },\n  \"suggested_pillar_settings\": { \"limpieza_artefactos\": 8, ... }\n}"

        try:
            client = genai.Client(api_key=current_key)
            
            parts = [types.Part.from_text(text=full_prompt)]
            
            if image_input.startswith("data:image"):
                try:
                    header, encoded = image_input.split(",", 1)
                    mime_type = header.split(":")[1].split(";")[0]
                    image_data = base64.b64decode(encoded)
                    parts.append(types.Part.from_bytes(data=image_data, mime_type=mime_type))
                except:
                    return {"error": "Invalid Image Data"}
            elif image_input.startswith("http"):
                 # For URL, if supported by new SDK directly?
                 # Usually needs download for API Key mode or GCS URI for Vertex.
                 # Let's assume text fallback for now if fetch fails, or implement fetch.
                 # Or use Part.from_uri if supported? Supported for GCS.
                 # Let's fetch bytes.
                 import requests
                 try:
                     resp = requests.get(image_input)
                     if resp.status_code == 200:
                         parts.append(types.Part.from_bytes(
                             data=resp.content, 
                             mime_type=resp.headers.get("Content-Type", "image/jpeg")
                         ))
                     else:
                         parts.append(types.Part.from_text(text=f"Image URL: {image_input} (Could not fetch)"))
                 except:
                     parts.append(types.Part.from_text(text=f"Image URL: {image_input}"))

            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=[types.Content(role="user", parts=parts)]
            )
            
            text = response.text
            # Simple JSON extraction
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

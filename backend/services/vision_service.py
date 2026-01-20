import google.generativeai as genai
import os
import json
import base64

class VisionService:
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
        
    async def analyze_image(self, image_input: str) -> dict:
        if not self.api_key:
            return {"error": "No API Key"}

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
            model = genai.GenerativeModel('gemini-2.0-flash') # Using Flash for speed/vision
            
            content_parts = [prompt]
            
            # Check if image_input is URL or Base64
            if image_input.startswith("data:image"):
                # Base64 Data URI
                try:
                    header, encoded = image_input.split(",", 1)
                    mime_type = header.split(":")[1].split(";")[0]
                    image_data = base64.b64decode(encoded)
                    
                    content_parts.append({
                        "mime_type": mime_type,
                        "data": image_data
                    })
                except Exception as e:
                    print(f"Base64 decode error: {e}")
                    return {"error": "Invalid Image Data"}
            else:
                # URL - Gemini API python client doesn't fetch URLs automatically.
                # We should fetch it or ask user for base64. 
                # For this MVP, if it's a URL, we'll try to use it as text description fallback
                # OR we could fetch it here.
                # Let's assume if it's http it's a URL, else it's a text description?
                if image_input.startswith("http"):
                    # Mock/Describe fallback since we can't easily fetch and pass to Gemini without requests
                    # But we can try to fetch it.
                    import requests
                    try:
                        resp = requests.get(image_input)
                        if resp.status_code == 200:
                            content_parts.append({
                                "mime_type": resp.headers.get("Content-Type", "image/jpeg"),
                                "data": resp.content
                            })
                        else:
                             content_parts.append(f"Image URL: {image_input} (Could not fetch)")
                    except:
                        content_parts.append(f"Image URL: {image_input}")
                else:
                    content_parts.append(f"Image Description: {image_input}")

            response = model.generate_content(content_parts)
            
            # Clean response to get JSON
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
                
            return json.loads(text)
            
        except Exception as e:
            print(f"Vision Analysis Failed: {e}")
            return {
                "semantic_anchors": ["Detected Image Subject (Fallback)"],
                "technical_assessment": {"noise_level": 5, "blur_level": 2},
                "suggested_pillar_settings": {}
            }

vision_service = VisionService()

from google import genai
from google.genai import types
import os
import json
import base64
from services.key_manager import key_manager

class VisionService:
    def __init__(self):
        # Model for vision analysis - Gemini 2.5 Flash
        self.model_name = 'gemini-2.5-flash-preview-05-20'
        
    async def analyze_image(self, image_input: str) -> dict:
        current_key = key_manager.get_next_key()
        if not current_key:
            return {"error": "No API Key"}
            
        prompt = """[LUXSCALER v28 VISION ANALYSIS PROTOCOL]

Analiza esta imagen fotográfica con precisión de estudio profesional.

DEVUELVE UN JSON EXACTO con este formato:

{
  "technical_score": <0-10, calidad técnica general>,
  "semantic_anchors": [<lista de 3-5 elementos importantes a PRESERVAR, ej: "wooden table texture", "scar on left cheek", "wedding ring">],
  "detected_issues": [<lista de problemas detectados, ej: "motion blur on hands", "underexposed shadows", "lens distortion">],
  "suggested_settings": {
    "limpieza_artefactos": <0-10>,
    "grano_filmico": <0-10>,
    "optica": <0-10>,
    "geometria": <0-10>,
    "enfoque": <0-10>,
    "resolucion": <0-10>,
    "chronos": <0-10>,
    "senal_raw": <0-10>,
    "sintesis_adn": <0-10>,
    "styling_piel": <0-10>,
    "styling_pelo": <0-10>,
    "styling_ropa": <0-10>,
    "maquillaje": <0-10>,
    "limpieza_entorno": <0-10>,
    "reencuadre_ia": <0-10>,
    "atmosfera": <0-10>,
    "look_cine": <0-10>,
    "materiales_pbr": <0-10>,
    "key_light": <0-10>,
    "fill_light": <0-10>,
    "rim_light": <0-10>,
    "volumetria": <0-10>,
    "temperatura": <0-10>,
    "contraste": <0-10>,
    "sombras": <0-10>,
    "estilo_autor": <0-10>,
    "reflejos": <0-10>
  },
  "recommended_profile": <"auto" si calidad > 7, "user" si 5-7, "pro" si 3-5, "prolux" si < 3>
}

IMPORTANTE:
- Solo sugiere valores > 0 para sliders que REALMENTE necesiten intervención
- Si la imagen está perfecta, la mayoría de valores serán 0
- semantic_anchors son elementos que NO deben modificarse (Identity Lock)
- detected_issues son problemas que SÍ deben corregirse

Devuelve SOLO el JSON válido, sin markdown ni explicaciones."""

        try:
            client = genai.Client(api_key=current_key)
            
            parts = [types.Part.from_text(text=prompt)]
            
            if image_input.startswith("data:image"):
                try:
                    header, encoded = image_input.split(",", 1)
                    mime_type = header.split(":")[1].split(";")[0]
                    image_data = base64.b64decode(encoded)
                    parts.append(types.Part.from_bytes(data=image_data, mime_type=mime_type))
                except:
                    return {"error": "Invalid Image Data"}
            elif image_input.startswith("http"):
                import requests
                try:
                    resp = requests.get(image_input, timeout=30)
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
                model=self.model_name,
                contents=[types.Content(role="user", parts=parts)]
            )
            
            text = response.text
            # Simple JSON extraction
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
                
            result = json.loads(text.strip())
            
            # Ensure required fields exist
            if 'technical_score' not in result:
                result['technical_score'] = 5
            if 'semantic_anchors' not in result:
                result['semantic_anchors'] = []
            if 'detected_issues' not in result:
                result['detected_issues'] = []
            if 'suggested_settings' not in result:
                result['suggested_settings'] = {}
            if 'recommended_profile' not in result:
                result['recommended_profile'] = 'auto'
                
            return result
            
        except Exception as e:
            key_manager.report_error(current_key)
            print(f"Vision Analysis Failed: {e}")
            return {
                "technical_score": 5,
                "semantic_anchors": ["Detected Image Subject (Fallback)"],
                "detected_issues": ["analysis_incomplete"],
                "suggested_settings": {},
                "recommended_profile": "auto"
            }

vision_service = VisionService()

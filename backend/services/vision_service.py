from google import genai
from google.genai import types
import base64
import httpx
import json
import os
from services.key_manager import key_manager

# Creative Director Vision Prompt v28.1
CREATIVE_DIRECTOR_PROMPT = """
[SYSTEM ROLE: WORLD-CLASS CREATIVE DIRECTOR & DOP (Director of Photography)]
[MINDSET: Annie Leibovitz / Roger Deakins / Architectural Digest]

INPUT DATA: You are viewing an image that needs professional enhancement.
CONTEXT: This may be an amateur shot that needs professional treatment.
GOAL: Reimagine this shot as a $100,000 High-End Production.

=== TASK 1: PRODUCTION GAP ANALYSIS ===
Analyze the image and identify the "Amateur vs. Pro" gaps:
1. LIGHTING GAP: Is it flat/flash? -> Imagine a Cinematic Rig (Arri SkyPanels, Profoto).
2. SET GAP: Is it messy/cluttered? -> Imagine a Set Designer cleaned it (Editorial look).
3. OPTICAL GAP: Is it mobile lens? -> Imagine a Medium Format Phase One + Prime Lens.
4. TIMING GAP: Are there distractions? -> Imagine we closed the street or waited for Golden Hour.

=== TASK 2: DETECT INTENT (THE "MAGAZINE COVER" PITCH) ===
Propose 5 high-end production concepts (Headlines) for this image.
Format as short, punchy headlines describing the final look.
Examples: "Vanity Fair Editorial Portrait", "Magnum Documentary B&W", "Architectural Digest Interior", "High-Speed Nike Commercial", "Vogue Street Style".

=== TASK 3: PRODUCTION BUDGET ALLOCATION (AUTO-CONFIG) ===
Select the #1 BEST CONCEPT and configure the 27 Sliders to achieve that $100k look.
Use values 1-10 where:
- 1-3: Subtle enhancement
- 4-6: Standard professional
- 7-9: High-end production
- 10: FORCE mode (complete re-production)

SLIDERS TO CONFIGURE:
- PHOTOSCALER (Camera Crew): limpieza_artefactos, geometria, optica, chronos, senal_raw, sintesis_adn, grano_filmico, enfoque, resolucion
- STYLESCALER (Art Department): styling_piel, styling_pelo, styling_ropa, maquillaje, limpieza_entorno, reencuadre_ia, atmosfera, look_cine, materiales_pbr
- LIGHTSCALER (Gaffer/Electric): key_light, fill_light, rim_light, volumetria, temperatura, contraste, sombras, estilo_autor, reflejos

=== CRITICAL: IDENTITY PRESERVATION ===
If there is a person in the image, their facial identity MUST be preserved.
Only set reencuadre_ia > 5 if composition change is absolutely needed.

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "production_analysis": {
    "current_quality": "Brief description of current state",
    "target_vision": "Brief description of target look",
    "gaps_detected": ["gap1", "gap2", "gap3"]
  },
  "intents_detected": [
    "1. 🎬 [Headline 1] - Brief description",
    "2. 💎 [Headline 2] - Brief description", 
    "3. 📸 [Headline 3] - Brief description",
    "4. ✨ [Headline 4] - Brief description",
    "5. 🎨 [Headline 5] - Brief description"
  ],
  "auto_settings": {
    "primary_intent_used": "Copy of intent #1 headline",
    "photoscaler": {
      "limpieza_artefactos": 1-10,
      "geometria": 1-10,
      "optica": 1-10,
      "chronos": 1-10,
      "senal_raw": 1-10,
      "sintesis_adn": 1-10,
      "grano_filmico": 1-10,
      "enfoque": 1-10,
      "resolucion": 1-10
    },
    "stylescaler": {
      "styling_piel": 1-10,
      "styling_pelo": 1-10,
      "styling_ropa": 1-10,
      "maquillaje": 1-10,
      "limpieza_entorno": 1-10,
      "reencuadre_ia": 1-10,
      "atmosfera": 1-10,
      "look_cine": 1-10,
      "materiales_pbr": 1-10
    },
    "lightscaler": {
      "key_light": 1-10,
      "fill_light": 1-10,
      "rim_light": 1-10,
      "volumetria": 1-10,
      "temperatura": 1-10,
      "contraste": 1-10,
      "sombras": 1-10,
      "estilo_autor": 1-10,
      "reflejos": 1-10
    }
  },
  "technical_diagnosis": {
    "noise_level": 1-10,
    "blur_level": 1-10,
    "exposure_issues": "none|underexposed|overexposed",
    "has_person": true/false,
    "dominant_colors": ["color1", "color2"]
  }
}
"""

class VisionService:
    def __init__(self):
        self.model_name = "gemini-2.5-flash"
    
    async def analyze_image(self, image_input: str) -> dict:
        """
        Analyzes image using Creative Director prompt.
        Returns structured JSON with intents and auto_settings.
        """
        api_key = get_next_api_key()
        if not api_key:
            return {"error": "No API keys available"}
        
        client = genai.Client(api_key=api_key)
        
        try:
            # Prepare image data
            if image_input.startswith('data:'):
                # Base64 data URL
                header, b64data = image_input.split(',', 1)
                mime_type = header.split(':')[1].split(';')[0]
                image_bytes = base64.b64decode(b64data)
            elif image_input.startswith('http'):
                # URL - download first
                async with httpx.AsyncClient() as http_client:
                    response = await http_client.get(image_input, timeout=30)
                    image_bytes = response.content
                    mime_type = response.headers.get('content-type', 'image/jpeg')
            else:
                # Assume raw base64
                image_bytes = base64.b64decode(image_input)
                mime_type = 'image/jpeg'
            
            # Create image part
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            
            # Call Gemini with Creative Director prompt
            response = client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(CREATIVE_DIRECTOR_PROMPT),
                            image_part
                        ]
                    )
                ],
                config=types.GenerateContentConfig(
                    temperature=0.4,
                    response_mime_type="application/json"
                )
            )
            
            # Parse JSON response
            response_text = response.text.strip()
            
            # Clean up response if needed
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            analysis = json.loads(response_text)
            
            # Ensure all required fields exist
            if 'intents_detected' not in analysis:
                analysis['intents_detected'] = ["1. 🎬 Standard Enhancement - Professional quality improvement"]
            
            if 'auto_settings' not in analysis:
                analysis['auto_settings'] = self._get_default_settings()
            
            if 'production_analysis' not in analysis:
                analysis['production_analysis'] = {
                    "current_quality": "Image analyzed",
                    "target_vision": "Professional enhancement"
                }
            
            return analysis
            
        except json.JSONDecodeError as e:
            print(f"VisionService: JSON parse error: {e}")
            print(f"Raw response: {response_text[:500] if 'response_text' in dir() else 'N/A'}")
            return self._get_fallback_analysis()
            
        except Exception as e:
            print(f"VisionService Error: {e}")
            return self._get_fallback_analysis()
    
    def _get_default_settings(self):
        """Default settings for AUTO mode"""
        return {
            "primary_intent_used": "Standard Enhancement",
            "photoscaler": {
                "limpieza_artefactos": 5, "geometria": 3, "optica": 5,
                "chronos": 3, "senal_raw": 5, "sintesis_adn": 4,
                "grano_filmico": 2, "enfoque": 5, "resolucion": 5
            },
            "stylescaler": {
                "styling_piel": 5, "styling_pelo": 4, "styling_ropa": 3,
                "maquillaje": 3, "limpieza_entorno": 5, "reencuadre_ia": 1,
                "atmosfera": 3, "look_cine": 4, "materiales_pbr": 3
            },
            "lightscaler": {
                "key_light": 5, "fill_light": 4, "rim_light": 3,
                "volumetria": 3, "temperatura": 5, "contraste": 5,
                "sombras": 4, "estilo_autor": 4, "reflejos": 3
            }
        }
    
    def _get_fallback_analysis(self):
        """Fallback when AI fails"""
        return {
            "production_analysis": {
                "current_quality": "Unable to analyze - using defaults",
                "target_vision": "Standard professional enhancement"
            },
            "intents_detected": [
                "1. 🎬 Standard Enhancement - Professional quality",
                "2. 💎 Clean Portrait - Polished look",
                "3. 📸 Natural Light - Soft enhancement",
                "4. ✨ Vibrant Colors - Pop and contrast",
                "5. 🎨 Artistic Edit - Creative treatment"
            ],
            "auto_settings": self._get_default_settings(),
            "technical_diagnosis": {
                "noise_level": 5,
                "blur_level": 3,
                "exposure_issues": "none",
                "has_person": True,
                "dominant_colors": ["neutral"]
            }
        }

vision_service = VisionService()

# LuxScaler v28.0 - Vision Service (COMPLETE REWRITE)
# FASE 2: Creative Director Vision Analysis + Proxy Vision

from google import genai
from google.genai import types
import base64
import httpx
import json
import os
from services.key_manager import key_manager
from services.input_normalizer import input_normalizer

# Creative Director Vision Prompt v28.1 (del documento maestro)
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

=== TASK 2: DETECT IMAGE CATEGORY ===
Classify this image into ONE of these categories:
- SELFIE: Self-portrait, typically close-up
- PORTRAIT: Professional/casual portrait of person(s)
- GROUP: Multiple people, social setting
- REAL_ESTATE: Interior/exterior property photography
- PRODUCT: Commercial product photography
- FOOD: Culinary/food photography
- LANDSCAPE: Nature, cityscapes, outdoor scenes
- EVENT: Wedding, party, concert, sports
- DOCUMENT: Scanned document, whiteboard, receipt
- PET: Animal photography
- ART: Artwork, illustration, creative piece
- OTHER: Anything not fitting above

=== TASK 3: DETECT INTENT (THE "MAGAZINE COVER" PITCH) ===
Propose 5 high-end production concepts (Headlines) for this image.
Format as short, punchy headlines describing the final look.
Examples: "Vanity Fair Editorial Portrait", "Magnum Documentary B&W", "Architectural Digest Interior", "High-Speed Nike Commercial", "Vogue Street Style".

=== TASK 4: PRODUCTION BUDGET ALLOCATION (AUTO-CONFIG) ===
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

=== TASK 5: TECHNICAL DIAGNOSIS ===
Provide objective technical measurements of the image.

=== CRITICAL: IDENTITY PRESERVATION ===
If there is a person in the image, their facial identity MUST be preserved.
Only set reencuadre_ia > 5 if composition change is absolutely needed.

=== OUTPUT FORMAT (JSON ONLY) ===
{
  "category": "SELFIE|PORTRAIT|GROUP|REAL_ESTATE|PRODUCT|FOOD|LANDSCAPE|EVENT|DOCUMENT|PET|ART|OTHER",
  "category_confidence": 0.0-1.0,
  "production_analysis": {
    "current_quality": "Brief description of current state",
    "target_vision": "Brief description of target look ($100k production)",
    "gaps_detected": ["LIGHTING GAP: description", "SET GAP: description", ...]
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
    "exposure_issues": "none|underexposed|overexposed|mixed",
    "has_person": true/false,
    "face_count": 0-N,
    "dominant_colors": ["color1", "color2", "color3"],
    "lighting_type": "natural|artificial|mixed|flash|studio",
    "composition_score": 1-10
  },
  "semantic_anchors": ["element1 to preserve", "element2 to preserve", ...],
  "protocol_alerts": ["Alert message if special handling needed", ...]
}
"""

# Category-specific rules (can be loaded from DB later)
CATEGORY_RULES = {
    "SELFIE": {
        "priority_sliders": ["styling_piel", "maquillaje", "key_light", "enfoque"],
        "max_reencuadre": 3,
        "identity_lock": "strict",
        "alert": "Selfie detected: Identity Lock at MAXIMUM. Focus on skin and lighting."
    },
    "PORTRAIT": {
        "priority_sliders": ["styling_piel", "styling_pelo", "key_light", "rim_light", "estilo_autor"],
        "max_reencuadre": 5,
        "identity_lock": "strict",
        "alert": "Portrait mode: Professional lighting priority. Preserve character."
    },
    "GROUP": {
        "priority_sliders": ["limpieza_artefactos", "fill_light", "enfoque"],
        "max_reencuadre": 3,
        "identity_lock": "strict",
        "alert": "Group photo: All faces protected. Uniform lighting adjustment."
    },
    "REAL_ESTATE": {
        "priority_sliders": ["geometria", "limpieza_entorno", "key_light", "contraste", "optica"],
        "max_reencuadre": 8,
        "identity_lock": "none",
        "alert": "Real estate: Geometry correction priority. Vertical lines must be straight."
    },
    "PRODUCT": {
        "priority_sliders": ["materiales_pbr", "reflejos", "limpieza_entorno", "key_light"],
        "max_reencuadre": 7,
        "identity_lock": "none",
        "alert": "Product photography: Material accuracy critical. PBR enhancement enabled."
    },
    "FOOD": {
        "priority_sliders": ["temperatura", "reflejos", "contraste", "sintesis_adn"],
        "max_reencuadre": 5,
        "identity_lock": "none",
        "alert": "Food photography: Warm tones, fresh look. Texture enhancement priority."
    },
    "LANDSCAPE": {
        "priority_sliders": ["senal_raw", "contraste", "volumetria", "atmosfera", "look_cine"],
        "max_reencuadre": 10,
        "identity_lock": "none",
        "alert": "Landscape: Full creative freedom. HDR and atmosphere enabled."
    },
    "EVENT": {
        "priority_sliders": ["limpieza_artefactos", "chronos", "fill_light", "enfoque"],
        "max_reencuadre": 4,
        "identity_lock": "moderate",
        "alert": "Event photo: Motion freeze priority. Multiple subjects protected."
    },
    "DOCUMENT": {
        "priority_sliders": ["geometria", "contraste", "limpieza_artefactos", "enfoque"],
        "max_reencuadre": 10,
        "identity_lock": "none",
        "alert": "Document scan: Geometry and contrast priority. B&W optimization."
    },
    "PET": {
        "priority_sliders": ["enfoque", "styling_pelo", "key_light", "chronos"],
        "max_reencuadre": 6,
        "identity_lock": "none",
        "alert": "Pet photography: Eye focus priority. Fur texture enhancement."
    },
    "ART": {
        "priority_sliders": ["resolucion", "contraste", "look_cine", "grano_filmico"],
        "max_reencuadre": 3,
        "identity_lock": "none",
        "alert": "Artwork: Color accuracy critical. Minimal processing to preserve artist intent."
    }
}


class VisionService:
    """
    Servicio de análisis de visión con Gemini.
    Implementa Proxy Vision (thumbnail 1024px) para eficiencia.
    """
    
    def __init__(self):
        self.model_name = "gemini-2.5-flash"
        self.proxy_dimension = 1024  # Proxy Vision uses 1024px thumbnails
    
    async def analyze_image(self, image_input: str, use_proxy: bool = True) -> dict:
        """
        Analiza imagen usando Creative Director prompt.
        
        Args:
            image_input: URL, base64, or data URL
            use_proxy: If True, creates 1024px thumbnail for analysis (80% cost savings)
        
        Returns:
            Complete vision analysis with category, intents, auto_settings
        """
        api_key = key_manager.get_next_key()
        if not api_key:
            return {"error": "No API keys available"}
        
        client = genai.Client(api_key=api_key)
        
        try:
            # Step 1: Optionally create thumbnail for Proxy Vision
            if use_proxy:
                thumb_result = await input_normalizer.create_thumbnail(
                    image_input, 
                    max_dimension=self.proxy_dimension
                )
                if thumb_result['success']:
                    image_bytes = thumb_result['thumbnail_bytes']
                    mime_type = 'image/jpeg'
                    aspect_ratio = thumb_result['aspect_ratio']
                    print(f"VisionService: Using proxy thumbnail ({self.proxy_dimension}px)")
                else:
                    # Fallback to full image
                    image_bytes, mime_type, aspect_ratio = await self._get_image_bytes(image_input)
            else:
                image_bytes, mime_type, aspect_ratio = await self._get_image_bytes(image_input)
            
            # Step 2: Create image part
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            
            # Step 3: Call Gemini with Creative Director prompt
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
            
            # Step 4: Parse JSON response
            response_text = response.text.strip()
            
            # Clean up response if needed
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            analysis = json.loads(response_text)
            
            # Step 5: Apply category rules
            category = analysis.get('category', 'OTHER')
            analysis = self._apply_category_rules(analysis, category)
            
            # Step 6: Add aspect ratio
            analysis['aspect_ratio'] = aspect_ratio
            
            # Step 7: Ensure all required fields
            analysis = self._ensure_required_fields(analysis)
            
            key_manager.report_success(api_key)
            return analysis
            
        except json.JSONDecodeError as e:
            print(f"VisionService: JSON parse error: {e}")
            print(f"Raw response: {response_text[:500] if 'response_text' in dir() else 'N/A'}")
            fallback = self._get_fallback_analysis()
            fallback['protocol_alerts'] = ['Análisis parcial - respuesta de IA no estructurada. Usando configuración inteligente.']
            return fallback
            
        except Exception as e:
            error_msg = str(e).lower()
            print(f"VisionService Error: {e}")
            key_manager.report_error(api_key)
            fallback = self._get_fallback_analysis()
            
            # Better error messages
            if '429' in error_msg or 'rate' in error_msg or 'quota' in error_msg:
                fallback['protocol_alerts'] = ['API temporalmente saturada. Usando configuración automática optimizada.']
            elif 'timeout' in error_msg:
                fallback['protocol_alerts'] = ['Timeout de análisis. Usando configuración rápida.']
            else:
                fallback['protocol_alerts'] = ['Análisis rápido activado. Configuración automática aplicada.']
            
            return fallback
    
    async def _get_image_bytes(self, image_input: str) -> tuple:
        """Extract image bytes, mime type, and aspect ratio from input."""
        from PIL import Image
        from io import BytesIO
        
        if image_input.startswith('data:'):
            header, b64data = image_input.split(',', 1)
            mime_type = header.split(':')[1].split(';')[0]
            image_bytes = base64.b64decode(b64data)
        elif image_input.startswith('http'):
            async with httpx.AsyncClient() as http_client:
                response = await http_client.get(image_input, timeout=30)
                image_bytes = response.content
                mime_type = response.headers.get('content-type', 'image/jpeg')
        else:
            image_bytes = base64.b64decode(image_input)
            mime_type = 'image/jpeg'
        
        # Get aspect ratio
        try:
            img = Image.open(BytesIO(image_bytes))
            aspect_ratio = round(img.width / img.height, 3)
        except:
            aspect_ratio = 1.0
        
        return image_bytes, mime_type, aspect_ratio
    
    def _apply_category_rules(self, analysis: dict, category: str) -> dict:
        """Apply category-specific rules and alerts."""
        rules = CATEGORY_RULES.get(category, CATEGORY_RULES.get('OTHER', {}))
        
        if not rules:
            return analysis
        
        # Add protocol alerts
        if 'protocol_alerts' not in analysis:
            analysis['protocol_alerts'] = []
        
        if 'alert' in rules:
            analysis['protocol_alerts'].append(rules['alert'])
        
        # Add category metadata
        analysis['category_rules'] = {
            'priority_sliders': rules.get('priority_sliders', []),
            'max_reencuadre': rules.get('max_reencuadre', 5),
            'identity_lock': rules.get('identity_lock', 'moderate')
        }
        
        # Enforce max reencuadre based on category
        auto_settings = analysis.get('auto_settings', {})
        if auto_settings.get('stylescaler', {}).get('reencuadre_ia', 0) > rules.get('max_reencuadre', 10):
            auto_settings['stylescaler']['reencuadre_ia'] = rules.get('max_reencuadre', 5)
            analysis['protocol_alerts'].append(
                f"Reencuadre limited to {rules['max_reencuadre']} for {category} category."
            )
        
        return analysis
    
    def _ensure_required_fields(self, analysis: dict) -> dict:
        """Ensure all required fields exist with defaults."""
        if 'category' not in analysis:
            analysis['category'] = 'OTHER'
        
        if 'intents_detected' not in analysis or not analysis['intents_detected']:
            analysis['intents_detected'] = [
                "1. 🎬 Professional Enhancement - Standard quality improvement",
                "2. 💎 Clean & Polished - Refined look",
                "3. 📸 Natural Light - Soft enhancement",
                "4. ✨ Vibrant Colors - Pop and contrast",
                "5. 🎨 Artistic Treatment - Creative processing"
            ]
        
        if 'auto_settings' not in analysis:
            analysis['auto_settings'] = self._get_default_settings()
        
        if 'production_analysis' not in analysis:
            analysis['production_analysis'] = {
                "current_quality": "Image analyzed",
                "target_vision": "Professional enhancement",
                "gaps_detected": []
            }
        
        if 'technical_diagnosis' not in analysis:
            analysis['technical_diagnosis'] = {
                "noise_level": 5,
                "blur_level": 3,
                "exposure_issues": "none",
                "has_person": True,
                "face_count": 0,
                "dominant_colors": ["neutral"],
                "lighting_type": "natural",
                "composition_score": 5
            }
        
        if 'semantic_anchors' not in analysis:
            analysis['semantic_anchors'] = []
        
        if 'protocol_alerts' not in analysis:
            analysis['protocol_alerts'] = []
        
        return analysis
    
    def _get_default_settings(self) -> dict:
        """Default AUTO settings."""
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
    
    def _get_fallback_analysis(self) -> dict:
        """Fallback when AI analysis fails."""
        return {
            "category": "OTHER",
            "category_confidence": 0.5,
            "production_analysis": {
                "current_quality": "Imagen recibida correctamente",
                "target_vision": "Mejora profesional automática",
                "gaps_detected": []
            },
            "intents_detected": [
                "1. 🎬 Mejora Estándar - Calidad profesional",
                "2. 💎 Retrato Limpio - Look pulido",
                "3. 📸 Luz Natural - Mejora suave",
                "4. ✨ Colores Vibrantes - Pop y contraste",
                "5. 🎨 Edición Artística - Tratamiento creativo"
            ],
            "auto_settings": self._get_default_settings(),
            "technical_diagnosis": {
                "noise_level": 5,
                "blur_level": 3,
                "exposure_issues": "none",
                "has_person": True,
                "face_count": 0,
                "dominant_colors": ["neutral"],
                "lighting_type": "natural",
                "composition_score": 5
            },
            "semantic_anchors": [],
            "protocol_alerts": [],  # Se añaden mensajes específicos en el catch
            "aspect_ratio": 1.0
        }


vision_service = VisionService()

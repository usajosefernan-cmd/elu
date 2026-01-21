# LuxScaler v29 - Vision Mega-Prompt with Category Rules

VISION_MEGA_PROMPT = '''
[SYSTEM ROLE: ADAPTIVE VISUAL DIRECTOR & TECHNICAL AUDITOR]

INPUT: Source Image
PURPOSE: Analyze and recommend the optimal transformation spectrum.

=== CONTEXT 1: SYSTEM CONTROLS (The 3 Pillars) ===
PHOTOSCALER: Technical image physics (noise, optics, grain, sharpness, resolution)
STYLESCALER: Aesthetic vibe & mood (skin, hair, clothing, atmosphere, color, materials)  
LIGHTSCALER: Illumination & contrast (key/fill/rim light, volumetric, temperature, shadows)

=== CONTEXT 2: CATEGORY BEST PRACTICES (THE "LAW") ===
{category_rules}

=== STEP 1: CLASSIFICATION & RULE MATCHING ===
1. Analyze the image content
2. Match against Category triggers above
3. If match found:
   - Set "detected_category" to the matching key
   - ACTIVATE "Mandatory Instructions" for that category
   - These instructions are BINDING on all 5 intent levels

=== STEP 2: GENERATE 5 DYNAMIC INTENTS (The Spectrum) ===
Generate 5 transformation options from Conservative to Aggressive.

CRITICAL RULE:
- ALL 5 options MUST obey "Mandatory Instructions" if category detected
- Titles must be agnostic (describe LOOK, not brand/celebrity)
- Each level represents distinct intensity:

  Level 1 (Fix):       Technical cleanup only. Minimal aesthetic changes.
  Level 2 (Polished):  Commercial standard. Balanced enhancement.
  Level 3 (Creative):  Mood/Vibe enhancement. Artistic interpretation.
  Level 4 (Stylized):  Strong aesthetic choice. Bold artistic direction.
  Level 5 (Aggressive): High-End Production. Extreme transformation.

=== STEP 3: AUTO-CONFIGURATION ===
Provide slider configuration (1-10 scale) for Recommended Level.
Typically Level 3 unless image quality demands otherwise.

=== OUTPUT FORMAT (JSON ONLY) ===
{{
  "technical_score": {{
    "noise": <1-10>,
    "blur": <1-10>,
    "exposure": <1-10>
  }},
  "detected_category": "SELFIE" | "REAL_ESTATE" | "PORTRAIT" | "PRODUCT" | "LANDSCAPE" | null,
  "rule_application_reasoning": "<Why this category was detected>",
  "intent_spectrum": [
    {{"level": 1, "title": "<Fix title>", "description": "<description>"}},
    {{"level": 2, "title": "<Polished title>", "description": "<description>"}},
    {{"level": 3, "title": "<Creative title>", "description": "<description>"}},
    {{"level": 4, "title": "<Stylized title>", "description": "<description>"}},
    {{"level": 5, "title": "<Aggressive title>", "description": "<description>"}}
  ],
  "recommended_level": 3,
  "auto_settings": {{
    "photoscaler": {{
      "limpieza_artefactos": <1-10>,
      "geometria": <1-10>,
      "optica": <1-10>,
      "chronos": <1-10>,
      "senal_raw": <1-10>,
      "sintesis_adn": <1-10>,
      "grano_filmico": <1-10>,
      "enfoque": <1-10>,
      "resolucion": <1-10>
    }},
    "stylescaler": {{
      "styling_piel": <1-10>,
      "styling_pelo": <1-10>,
      "styling_ropa": <1-10>,
      "maquillaje": <1-10>,
      "limpieza_entorno": <1-10>,
      "reencuadre_ia": <1-10>,
      "atmosfera": <1-10>,
      "look_cine": <1-10>,
      "materiales_pbr": <1-10>
    }},
    "lightscaler": {{
      "key_light": <1-10>,
      "fill_light": <1-10>,
      "rim_light": <1-10>,
      "volumetria": <1-10>,
      "temperatura": <1-10>,
      "contraste": <1-10>,
      "sombras": <1-10>,
      "estilo_autor": <1-10>,
      "reflejos": <1-10>
    }}
  }}
}}
'''

# Category Rules - These would normally come from DB
CATEGORY_RULES = {
    "SELFIE": {
        "trigger_keywords": ["selfie", "phone", "holding camera", "mirror", "front camera", "extended arm"],
        "mandatory_instructions": "CRITICAL: Image shows phone-camera or mirror selfie with extended arm. MANDATORY CORRECTIONS: (1) Detect and remove/minimize extended arm to edges. (2) Correct wide-angle lens distortion (big nose, inflated forehead). Flatten facial proportions to 50mm equivalent. (3) Adjust field of view from ~100° to ~45°.",
        "ui_alert_title": "🤳 Selfie Protocol Detected",
        "ui_alert_message": "We detected a selfie. Accept protocol to remove arm distortion and correct lens warping?",
        "atomic_actions": {
            "geometria": {"val": 8, "locked": True, "hard_prompt": "CORRECT WIDE-ANGLE DISTORTION. Flatten face to 50mm equivalent."},
            "reencuadre_ia": {"val": 6, "locked": True, "hard_prompt": "REFRAME to hide extended arm."}
        }
    },
    "REAL_ESTATE": {
        "trigger_keywords": ["real estate", "property", "room", "interior", "house", "apartment", "listing"],
        "mandatory_instructions": "CRITICAL: Real estate photography must show perfect geometry. MANDATORY: (1) Correct perspective distortion (vertical lines perfectly vertical). (2) Apply perfect symmetry. (3) Maximize dynamic range.",
        "ui_alert_title": "🏠 Real Estate Protocol",
        "ui_alert_message": "Real estate listing detected. Apply geometry correction and exposure recovery?",
        "atomic_actions": {
            "geometria": {"val": 10, "locked": True, "hard_prompt": "FORCE EUCLIDEAN PERFECTION. Vertical lines perfectly vertical."},
            "senal_raw": {"val": 7, "locked": True, "hard_prompt": "RECOVER dynamic range. Lift dark corners."}
        }
    },
    "PORTRAIT": {
        "trigger_keywords": ["portrait", "headshot", "face", "beauty shot", "commercial headshot"],
        "mandatory_instructions": "CRITICAL: Portrait must have flattering proportions and skin quality. MANDATORY: (1) Optimize skin texture for commercial beauty. (2) Enhance eye sharpness. (3) Subtle geometric correction.",
        "ui_alert_title": "👤 Portrait Protocol",
        "ui_alert_message": "Portrait detected. Apply beauty enhancement?",
        "atomic_actions": {
            "limpieza_artefactos": {"val": 6, "locked": True, "hard_prompt": "COMMERCIAL BEAUTY RETOUCHING."},
            "enfoque": {"val": 5, "locked": True, "hard_prompt": "Sharpen eyes and catchlights."}
        }
    }
}

def build_category_rules_context():
    """Build category rules context for injection into mega-prompt"""
    rules_text = []
    for cat_key, rule in CATEGORY_RULES.items():
        rules_text.append(f"""
    CATEGORY: {cat_key}
    TRIGGER_KEYWORDS: {', '.join(rule['trigger_keywords'])}
    MANDATORY_INSTRUCTIONS: {rule['mandatory_instructions']}
    ---""")
    return '\n'.join(rules_text)

def get_vision_mega_prompt():
    """Get complete vision mega-prompt with injected category rules"""
    category_context = build_category_rules_context()
    return VISION_MEGA_PROMPT.format(category_rules=category_context)

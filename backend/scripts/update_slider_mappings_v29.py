# LuxScaler v29 - Slider Semantic Mappings
# Script para actualizar la base de datos con las instrucciones correctas

import asyncio
from services.supabase_service import supabase_db

SLIDER_MAPPINGS = [
    # PHOTOSCALER (9 sliders)
    {
        "pillar_name": "photoscaler",
        "slider_name": "limpieza_artefactos",
        "display_name": "Artifact Cleanup",
        "instruction_off": "Preserve original patina",
        "instruction_low": "Minor cleanup, light retouch",
        "instruction_med": "Standard studio cleanup, frequency separation",
        "instruction_high": "High-end beauty, aggressive cleanup, extreme retouching",
        "instruction_force": "FORENSIC RECONSTRUCTION. ELIMINATE ALL NOISE. SYNTHESIZE PERFECT SKIN TEXTURE. PLASTIC SURGERY LEVEL."
    },
    {
        "pillar_name": "photoscaler",
        "slider_name": "geometria",
        "display_name": "Geometry Correction",
        "instruction_off": "Original perspective",
        "instruction_low": "Lens profile correction, subtle straightening",
        "instruction_med": "Standard correction, architecture symmetry",
        "instruction_high": "Aggressive correction, blueprint precision, force symmetry",
        "instruction_force": "REBUILD SET GEOMETRY. FORCE EUCLIDEAN PERFECTION. MATHEMATICALLY PERFECT LINES. BLUEPRINT PRECISION."
    },
    {
        "pillar_name": "photoscaler",
        "slider_name": "optica",
        "display_name": "Optical Character",
        "instruction_off": "Vintage lens character",
        "instruction_low": "Remove chromatic aberration, modern prime look",
        "instruction_med": "Sharp corners, zero distortion, Phase One clarity",
        "instruction_high": "Extreme sharpness, macro-level detail, physics-defying clarity",
        "instruction_force": "PHYSICS DEFYING SHARPNESS. SYNTHETIC LENS SIMULATION. MACRO-LEVEL DETAIL. ZERO OPTICAL FLAWS."
    },
    {
        "pillar_name": "photoscaler",
        "slider_name": "chronos",
        "display_name": "Motion Stabilization",
        "instruction_off": "Natural motion blur",
        "instruction_low": "Stabilize camera shake, freeze action",
        "instruction_med": "Sports photography shutter, high-speed strobe look",
        "instruction_high": "Frozen particles, stop time effect, 1/8000s equivalence",
        "instruction_force": "STOP TIME. 1/8000s SHUTTER SPEED. ELIMINATE ALL BLUR. RECONSTRUCT SMEARED PIXELS. CRYSTAL CLEAR ACTION."
    },
    {
        "pillar_name": "photoscaler",
        "slider_name": "senal_raw",
        "display_name": "Raw Signal Recovery",
        "instruction_off": "Standard JPEG range",
        "instruction_low": "Lift shadows, recover highlights",
        "instruction_med": "14-bit RAW development, HDR tone mapping, Zone System placement",
        "instruction_high": "Maximum dynamic range, 32-bit workflow, synthesize missing data",
        "instruction_force": "32-BIT EXR WORKFLOW. SYNTHESIZE MISSING DYNAMIC RANGE. PERFECT HISTOGRAM. RECOVER ALL CLIPPED DATA."
    },
    {
        "pillar_name": "photoscaler",
        "slider_name": "sintesis_adn",
        "display_name": "Texture Synthesis",
        "instruction_off": "Soft organic texture",
        "instruction_low": "Enhance surface detail, high-frequency synthesis",
        "instruction_med": "Texture injection, 8K texture quality, microscopic fidelity",
        "instruction_high": "Generate 16K textures, hallucinate details, hyper-realism",
        "instruction_force": "MICROSCOPIC FIDELITY. GENERATE 16K TEXTURES. HALLUCINATE MISSING DETAILS. HYPER-REALISM."
    },
    {
        "pillar_name": "photoscaler",
        "slider_name": "grano_filmico",
        "display_name": "Film Grain",
        "instruction_off": "Digital clean",
        "instruction_low": "Subtle cinema grain, Kodak Portra 400",
        "instruction_med": "Ilford HP5 pushed, heavy 16MM stock",
        "instruction_high": "Damaged film aesthetic, max grain structure, vintage emulsion",
        "instruction_force": "HEAVY 16MM STOCK. DAMAGED FILM AESTHETIC. MAX GRAIN STRUCTURE. VINTAGE EMULSION OVERLAY."
    },
    {
        "pillar_name": "photoscaler",
        "slider_name": "enfoque",
        "display_name": "Sharpening",
        "instruction_off": "Soft focus",
        "instruction_low": "Smart sharpen edges, high-pass filter",
        "instruction_med": "Unsharp mask, aggressive sharpening, deconvolution",
        "instruction_high": "Vector edges, razor sharp cuts, synthetic acutance",
        "instruction_force": "DECONVOLUTION SHARPENING. VECTOR EDGES. RAZOR SHARP CUTS. SYNTHETIC ACUTANCE."
    },
    {
        "pillar_name": "photoscaler",
        "slider_name": "resolucion",
        "display_name": "Upscale Resolution",
        "instruction_off": "Native resolution",
        "instruction_low": "2x upscale smooth, 4x upscale detailed",
        "instruction_med": "Gigapixel density, infinite resolution, vectorize pixels",
        "instruction_high": "Remove grid, print on buildings quality, extreme detail",
        "instruction_force": "INFINITE RESOLUTION. VECTORIZE PIXELS. REMOVE GRID. PRINT ON BUILDINGS QUALITY."
    },
    
    # STYLESCALER (9 sliders)
    {
        "pillar_name": "stylescaler",
        "slider_name": "styling_piel",
        "display_name": "Skin Styling",
        "instruction_off": "Natural skin",
        "instruction_low": "Healthy glow, even tone",
        "instruction_med": "Commercial beauty, editorial fashion, porcelain look",
        "instruction_high": "Digital skin graft, synthetic perfection, remove pores",
        "instruction_force": "DIGITAL SKIN GRAFT. SYNTHETIC PERFECTION. REMOVE PORES. DOLL-LIKE SURFACE. ABSOLUTE GLAMOUR."
    },
    {
        "pillar_name": "stylescaler",
        "slider_name": "styling_pelo",
        "display_name": "Hair Styling",
        "instruction_off": "Natural messy hair",
        "instruction_low": "Control frizz, add shine",
        "instruction_med": "Salon blowout, defined volume, keratin treatment",
        "instruction_high": "Liquid hair look, L'OREAL commercial, synthetic fiber",
        "instruction_force": "L'OREAL COMMERCIAL HAIR. SYNTHETIC FIBER. PERFECT GEOMETRY. MAX VOLUME. ZERO FLYAWAYS."
    },
    {
        "pillar_name": "stylescaler",
        "slider_name": "styling_ropa",
        "display_name": "Clothing Styling",
        "instruction_off": "Natural folds",
        "instruction_low": "Steam ironed, tailored fit",
        "instruction_med": "Premium fabric, haute couture finish, liquid silk",
        "instruction_high": "Re-tailor clothing, perfect drape, synthesize luxury",
        "instruction_force": "RE-TAILOR CLOTHING. PERFECT DRAPE. SYNTHESIZE LUXURY FABRIC. REMOVE ALL WRINKLES. EXPENSIVE TEXTURE."
    },
    {
        "pillar_name": "stylescaler",
        "slider_name": "maquillaje",
        "display_name": "Makeup",
        "instruction_off": "No makeup",
        "instruction_low": "Natural enhancement, red carpet glam",
        "instruction_med": "Editorial avant-garde, drag contour, heavy stage makeup",
        "instruction_high": "Neon pigments, synthetic lashes, mask perfection",
        "instruction_force": "DRAG CONTOUR. HEAVY STAGE MAKEUP. NEON PIGMENTS. SYNTHETIC LASHES. MASK PERFECTION."
    },
    {
        "pillar_name": "stylescaler",
        "slider_name": "limpieza_entorno",
        "display_name": "Environment Cleanup",
        "instruction_off": "Authentic clutter",
        "instruction_low": "Tidy up trash, organized props",
        "instruction_med": "Set dresser work, studio minimalist, remove furniture",
        "instruction_high": "Delete background, infinite studio, void space",
        "instruction_force": "DELETE BACKGROUND. INFINITE STUDIO CYCLORAMA. VOID SPACE. ABSTRACT MINIMALISM. ISOLATE SUBJECT."
    },
    {
        "pillar_name": "stylescaler",
        "slider_name": "reencuadre_ia",
        "display_name": "AI Reframing",
        "instruction_off": "Original framing",
        "instruction_low": "Rule of thirds, cinematic 2.35:1",
        "instruction_med": "Aggressive tight crop, Fibonacci spiral, perfect composition",
        "instruction_high": "Re-compose reality, cinematographer eye, extreme crop",
        "instruction_force": "FORCE FIBONACCI SPIRAL. PERFECT COMPOSITION. RE-COMPOSE REALITY. CINEMATOGRAPHER EYE."
    },
    {
        "pillar_name": "stylescaler",
        "slider_name": "atmosfera",
        "display_name": "Atmosphere",
        "instruction_off": "Clear air",
        "instruction_low": "Subtle depth haze, volumetric fog",
        "instruction_med": "Dreamy diffusion, silent hill fog, zero visibility",
        "instruction_high": "Thick smoke, ethereal glow, heavy mood",
        "instruction_force": "SILENT HILL FOG. ZERO VISIBILITY. THICK SMOKE. ETHEREAL GLOW. HEAVY MOOD."
    },
    {
        "pillar_name": "stylescaler",
        "slider_name": "look_cine",
        "display_name": "Cinematic Look",
        "instruction_off": "Standard color",
        "instruction_low": "Color harmony, film emulation LUT",
        "instruction_med": "Blockbuster teal & orange, matrix grade, extreme color shift",
        "instruction_high": "Stylized reality, acid trip palette, cross process",
        "instruction_force": "MATRIX GRADE. EXTREME COLOR SHIFT. STYLIZED REALITY. ACID TRIP PALETTE. CROSS PROCESS."
    },
    {
        "pillar_name": "stylescaler",
        "slider_name": "materiales_pbr",
        "display_name": "PBR Materials",
        "instruction_off": "Flat textures",
        "instruction_low": "Enhance gloss, PBR wet look",
        "instruction_med": "Raytraced reflection, Unreal Engine render, perfect reflections",
        "instruction_high": "Liquid metal, 100% glossiness, chrome world",
        "instruction_force": "UNREAL ENGINE 5 RENDER. PERFECT REFLECTIONS. LIQUID METAL. 100% GLOSSINESS. CHROME WORLD."
    },
    
    # LIGHTSCALER (9 sliders)
    {
        "pillar_name": "lightscaler",
        "slider_name": "key_light",
        "display_name": "Key Light",
        "instruction_off": "Ambient light",
        "instruction_low": "Reflector bounce, softbox Octa 5ft",
        "instruction_med": "Commercial key, Fresnel spot 10K, hard directional",
        "instruction_high": "Blinding stage light, pure beam, theatrical",
        "instruction_force": "BLINDING STAGE SPOTLIGHT. PURE DIRECTIONAL BEAM. THEATRICAL LIGHTING. HARD SHADOWS."
    },
    {
        "pillar_name": "lightscaler",
        "slider_name": "fill_light",
        "display_name": "Fill Light",
        "instruction_off": "Natural contrast",
        "instruction_low": "White card bounce, commercial fill",
        "instruction_med": "High key beauty, shadowless world, 360 degree light",
        "instruction_high": "Overexpose shadows, pure white void, no shadows",
        "instruction_force": "SHADOWLESS WORLD. 360 DEGREE LIGHTING. OVEREXPOSE SHADOWS. PURE WHITE VOID."
    },
    {
        "pillar_name": "lightscaler",
        "slider_name": "rim_light",
        "display_name": "Rim Light",
        "instruction_off": "No rim",
        "instruction_low": "Subtle hair light, kicker strip",
        "instruction_med": "Strong backlight, halo effect, Tron neon",
        "instruction_high": "Nuclear backlight, silhouette, glowing edges",
        "instruction_force": "TRON NEON OUTLINE. NUCLEAR BACKLIGHT. SILHOUETTE SEPARATION. GLOWING EDGES."
    },
    {
        "pillar_name": "lightscaler",
        "slider_name": "volumetria",
        "display_name": "Volumetric Light",
        "instruction_off": "Invisible air",
        "instruction_low": "Soft bloom, light shafts",
        "instruction_med": "God rays, Tyndall effect, solid light beams",
        "instruction_high": "Laser projection, dense particles, heavenly light",
        "instruction_force": "SOLID LIGHT BEAMS. LASER PROJECTION. DENSE PARTICLES. HEAVENLY LIGHT."
    },
    {
        "pillar_name": "lightscaler",
        "slider_name": "temperatura",
        "display_name": "Color Temperature",
        "instruction_off": "Neutral",
        "instruction_low": "Warm/cool gel, golden hour",
        "instruction_med": "Blue hour, heavy gel, fire and ice",
        "instruction_high": "Extreme shift, dual tone neon, override white balance",
        "instruction_force": "FIRE AND ICE. EXTREME KELVIN SHIFT. DUAL TONE NEON. OVERRIDE WHITE BALANCE."
    },
    {
        "pillar_name": "lightscaler",
        "slider_name": "contraste",
        "display_name": "Contrast",
        "instruction_off": "Linear",
        "instruction_low": "S-curve, punchy",
        "instruction_med": "Crushed blacks, binary BW, ink shadows",
        "instruction_high": "Blinding whites, no midtones, extreme crush",
        "instruction_force": "BINARY BLACK AND WHITE. INK SHADOWS. BLINDING WHITES. NO MIDTONES."
    },
    {
        "pillar_name": "lightscaler",
        "slider_name": "sombras",
        "display_name": "Shadow Character",
        "instruction_off": "Standard grey",
        "instruction_low": "Deepen blacks, negative fill",
        "instruction_med": "Silhouette, vantablack, pure void",
        "instruction_high": "Abyssal darkness, zero detail, extreme blacks",
        "instruction_force": "VANTABLACK SHADOWS. PURE VOID. ABYSSAL DARKNESS. ZERO DETAIL IN BLACKS."
    },
    {
        "pillar_name": "lightscaler",
        "slider_name": "estilo_autor",
        "display_name": "Author Style",
        "instruction_off": "Snapshot",
        "instruction_low": "Pro studio, Roger Deakins",
        "instruction_med": "Caravaggio, Renaissance painting, museum drama",
        "instruction_high": "Heavy artificial, masterpiece, artistic",
        "instruction_force": "RENAISSANCE PAINTING. MUSEUM DRAMA. HEAVY ARTIFICIAL LIGHTING. MASTERPIECE."
    },
    {
        "pillar_name": "lightscaler",
        "slider_name": "reflejos",
        "display_name": "Specularity",
        "instruction_off": "Matte",
        "instruction_low": "Healthy shine, dewy skin",
        "instruction_med": "Moist, wet look, oiled",
        "instruction_high": "Mirror surface, chrome skin, latex shine",
        "instruction_force": "MIRROR SURFACE. CHROME SKIN. LATEX SHINE. PERFECT SPECULARITY."
    }
]

async def update_mappings():
    """Update all slider mappings in Supabase"""
    print("Updating 27 slider semantic mappings...")
    
    for mapping in SLIDER_MAPPINGS:
        try:
            # Check if exists
            existing = supabase_db.client.table("slider_semantic_mappings").select("id").eq(
                "slider_name", mapping["slider_name"]
            ).eq("pillar_name", mapping["pillar_name"]).execute()
            
            if existing.data:
                # Update
                supabase_db.client.table("slider_semantic_mappings").update(mapping).eq(
                    "id", existing.data[0]["id"]
                ).execute()
                print(f"  Updated: {mapping['slider_name']}")
            else:
                # Insert
                supabase_db.client.table("slider_semantic_mappings").insert(mapping).execute()
                print(f"  Inserted: {mapping['slider_name']}")
        except Exception as e:
            print(f"  Error with {mapping['slider_name']}: {e}")
    
    print("Done!")

if __name__ == "__main__":
    asyncio.run(update_mappings())

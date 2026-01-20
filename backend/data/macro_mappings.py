# LUXSCALER v27 - Macro Mappings
# Maps high-level controls to the 27 low-level pillar slider values (0-10)

def apply_user_macro(config, quality_val, aesthetics_val, light_val):
    """
    Applies the 3 User Mode Master Sliders to the config.
    Values are 0-10.
    """
    # 1. 💎 CALIDAD IMAGEN (Photoscaler focus)
    # Affects: limpieza_artefactos, resolucion, enfoque, geometria, chronos
    # Logic: Linear interpolation based on quality_val
    config['photoscaler']['sliders'][0]['value'] = int(quality_val) # limpieza_artefactos
    config['photoscaler']['sliders'][8]['value'] = int(quality_val) # resolucion
    config['photoscaler']['sliders'][7]['value'] = int(quality_val * 0.8) # enfoque (caps at 8 usually)
    config['photoscaler']['sliders'][1]['value'] = int(quality_val * 0.5) # geometria
    config['photoscaler']['sliders'][3]['value'] = int(quality_val * 0.5) # chronos

    # 2. ✨ ESTÉTICA IA (Stylescaler focus)
    # Affects: styling_piel, look_cine, limpieza_entorno, reencuadre_ia
    config['stylescaler']['sliders'][0]['value'] = int(aesthetics_val * 0.5) # styling_piel
    config['stylescaler']['sliders'][7]['value'] = int(aesthetics_val * 0.3) # look_cine (low impact)
    config['stylescaler']['sliders'][4]['value'] = int(aesthetics_val * 0.5) # limpieza_entorno
    config['stylescaler']['sliders'][5]['value'] = int(aesthetics_val * 0.3) # reencuadre_ia

    # 3. 💡 ILUMINACIÓN PRO (Lightscaler focus)
    # Affects: key_light, fill_light, contraste, temperatura
    config['lightscaler']['sliders'][0]['value'] = int(light_val * 0.5) # key_light
    config['lightscaler']['sliders'][1]['value'] = int(light_val * 0.5) # fill_light
    config['lightscaler']['sliders'][5]['value'] = int(light_val * 0.5) # contraste
    config['lightscaler']['sliders'][4]['value'] = int(light_val * 0.3) # temperatura
    
    return config

PRO_MACROS = {
    # PHOTOSCALER MACROS
    "macro_restoration": {
        "description": "Modo Forense. Elimina todo lo que no sea imagen limpia.",
        "updates": {
            "photoscaler": {
                "limpieza_artefactos": 10,
                "geometria": 8,
                "chronos": 9,
                "grano_filmico": 0
            }
        }
    },
    "macro_fidelity": {
        "description": "Hiperrealismo digital. Texturas nítidas y alta definición.",
        "updates": {
            "photoscaler": {
                "resolucion": 10,
                "enfoque": 8,
                "sintesis_adn": 6,
                "senal_raw": 5
            }
        }
    },
    "macro_character": {
        "description": "Look analógico/vintage. Permite imperfecciones estéticas.",
        "updates": {
            "photoscaler": {
                "grano_filmico": 8,
                "optica": 6,
                "senal_raw": 7,
                "limpieza_artefactos": 3 # "Low" mapped roughly to 3
            }
        }
    },
    # STYLESCALER MACROS
    "macro_presence": {
        "description": "Belleza/Retrato. Piel luminosa, ojos brillantes.",
        "updates": {
            "stylescaler": {
                "styling_piel": 9,
                "styling_pelo": 8,
                "maquillaje": 6,
                "reflejos": 5 # Note: reflejos is actually in lightscaler in strict pillar struct, 
                              # but user doc put it here. We follow strict BD structure:
                              # reflejos is in LIGHTSCALER pillar in Section 4.3 & 13.2 of PRD.
                              # We will update Lightscaler's reflejos.
            },
            "lightscaler": { # Handle cross-pillar update
                "reflejos": 5 
            }
        }
    },
    "macro_polish": {
        "description": "Planchado y Limpieza. Perfecto para e-commerce.",
        "updates": {
            "stylescaler": {
                "styling_ropa": 10,
                "limpieza_entorno": 8,
                "reencuadre_ia": 5
            }
        }
    },
    "macro_cinematic": {
        "description": "Color grading y mood. Transforma una foto plana en frame de película.",
        "updates": {
            "stylescaler": {
                "look_cine": 9,
                "atmosfera": 6,
                "materiales_pbr": 5
            }
        }
    },
    # LIGHTSCALER MACROS
    "macro_volume": {
        "description": "Crea tridimensionalidad (Luz Rembrandt/Studio).",
        "updates": {
            "lightscaler": {
                "key_light": 8,
                "fill_light": 6,
                "sombras": 2,
                "reflejos": 7
            }
        }
    },
    "macro_drama": {
        "description": "Look Noir/Impacto. Mata los medios tonos.",
        "updates": {
            "lightscaler": {
                "contraste": 10,
                "sombras": 9,
                "rim_light": 8,
                "fill_light": 0
            }
        }
    },
    "macro_atmosphere": {
        "description": "Efectos de luz ambiental (God rays, niebla, hora dorada).",
        "updates": {
            "lightscaler": {
                "volumetria": 9,
                "temperatura": 8,
                "estilo_autor": 6
            }
        }
    }
}

def apply_pro_macro(config, macro_key):
    if macro_key not in PRO_MACROS:
        return config
    
    updates = PRO_MACROS[macro_key]["updates"]
    
    for pillar_name, sliders in updates.items():
        if pillar_name in config:
            for s_name, s_val in sliders.items():
                # Find slider and update
                for s in config[pillar_name]['sliders']:
                    if s['name'] == s_name:
                        s['value'] = s_val
                        # Note: Caller must update snippet/levelText after this
                        break
    return config

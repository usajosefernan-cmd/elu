# LuxScaler v28.0 - Block Injector Service
# FASE 4 PASO 2: Inyección de Bloques (Template Injection)
# Según documento maestro del usuario

from typing import Dict, List, Any
from dataclasses import dataclass
from services.supabase_service import supabase_db


@dataclass
class SemanticTranslation:
    """Traducción semántica de un slider a instrucción."""
    slider_name: str
    value: int
    instruction: str
    pillar: str


@dataclass
class CompilerBlockOutput:
    """Bloques de salida del compilador por pilar."""
    PHOTOSCALER_BLOCK: str
    STYLESCALER_BLOCK: str
    LIGHTSCALER_BLOCK: str


class BlockInjector:
    """
    Inyector de bloques semánticos.
    
    Busca los textos en la BD y los inyecta solo si el slider es > 0.
    Paso 2 del algoritmo PromptCompilerService.
    """
    
    def __init__(self):
        self._mappings_cache = {}
        self._loaded = False
    
    async def _load_mappings(self) -> None:
        """Carga los mappings semánticos desde Supabase."""
        if self._loaded:
            return
        
        try:
            response = supabase_db.client.table("slider_semantic_mappings").select("*").execute()
            
            for item in response.data or []:
                slider_name = item.get('slider_name', '')
                pillar = item.get('pillar_name', '').upper()
                
                # Mapear los 11 niveles (0-10)
                levels = {}
                level_keys = [
                    ('instruction_off', 0),
                    ('instruction_low', 1),
                    ('instruction_low', 2),
                    ('instruction_low', 3),
                    ('instruction_med', 4),
                    ('instruction_med', 5),
                    ('instruction_med', 6),
                    ('instruction_high', 7),
                    ('instruction_high', 8),
                    ('instruction_force', 9),
                    ('instruction_force', 10),
                ]
                
                for key, level in level_keys:
                    instruction = item.get(key, '')
                    if instruction:
                        levels[level] = instruction
                
                # También parsear si viene en formato JSON 'descriptions'
                descriptions = item.get('descriptions', {})
                if isinstance(descriptions, dict):
                    for level_str, instruction in descriptions.items():
                        try:
                            levels[int(level_str)] = instruction
                        except (ValueError, TypeError):
                            pass
                
                self._mappings_cache[slider_name] = {
                    'pillar': pillar,
                    'display_name': item.get('display_name', slider_name),
                    'levels': levels
                }
            
            self._loaded = True
            print(f"BlockInjector: Loaded {len(self._mappings_cache)} slider mappings from DB")
            
        except Exception as e:
            print(f"BlockInjector: Error loading mappings: {e}")
            # Fallback a mappings hardcodeados si la BD falla
            self._load_fallback_mappings()
    
    def _load_fallback_mappings(self) -> None:
        """Mappings de respaldo si la BD no está disponible."""
        fallback = {
            # PHOTOSCALER
            'limpieza_artefactos': {
                'pillar': 'PHOTOSCALER',
                'levels': {
                    0: 'Preserve original patina and texture',
                    5: 'Standard studio retouching',
                    10: 'FORENSIC RECONSTRUCTION. ELIMINATE ALL NOISE. SYNTHETIC PERFECTION.'
                }
            },
            'geometria': {
                'pillar': 'PHOTOSCALER',
                'levels': {
                    0: 'Original perspective',
                    5: 'Perfect grid alignment',
                    10: 'REBUILD SET GEOMETRY. FORCE EUCLIDEAN PERFECTION. BLUEPRINT PRECISION.'
                }
            },
            'optica': {
                'pillar': 'PHOTOSCALER',
                'levels': {
                    0: 'Vintage lens character',
                    5: 'Phase One clarity',
                    10: 'PHYSICS DEFYING SHARPNESS. SYNTHETIC LENS SIMULATION. ZERO OPTICAL FLAWS.'
                }
            },
            'chronos': {
                'pillar': 'PHOTOSCALER',
                'levels': {
                    0: 'Natural motion blur',
                    5: 'Frozen particles',
                    10: 'STOP TIME. 1/8000s SHUTTER SPEED. CRYSTAL CLEAR ACTION.'
                }
            },
            'senal_raw': {
                'pillar': 'PHOTOSCALER',
                'levels': {
                    0: 'Standard JPEG range',
                    5: 'Zone System placement',
                    10: '32-BIT EXR WORKFLOW. SYNTHESIZE MISSING DYNAMIC RANGE.'
                }
            },
            'sintesis_adn': {
                'pillar': 'PHOTOSCALER',
                'levels': {
                    0: 'Soft organic texture',
                    5: 'Microscopic fidelity',
                    10: 'GENERATE 16K TEXTURES. HALLUCINATE MISSING DETAILS. HYPER-REALISM.'
                }
            },
            'grano_filmico': {
                'pillar': 'PHOTOSCALER',
                'levels': {
                    0: 'Digital clean',
                    5: 'Damaged film aesthetic',
                    10: 'HEAVY 16MM STOCK. MAX GRAIN STRUCTURE. VINTAGE EMULSION.'
                }
            },
            'enfoque': {
                'pillar': 'PHOTOSCALER',
                'levels': {
                    0: 'Soft focus',
                    5: 'Deconvolution',
                    10: 'DECONVOLUTION SHARPENING. VECTOR EDGES. RAZOR SHARP CUTS.'
                }
            },
            'resolucion': {
                'pillar': 'PHOTOSCALER',
                'levels': {
                    0: 'Native resolution',
                    5: 'Vectorize pixels',
                    10: 'INFINITE RESOLUTION. PRINT ON BUILDINGS QUALITY.'
                }
            },
            # STYLESCALER
            'styling_piel': {
                'pillar': 'STYLESCALER',
                'levels': {
                    0: 'Natural skin',
                    5: 'Porcelain look',
                    10: 'DIGITAL SKIN GRAFT. SYNTHETIC PERFECTION. DOLL-LIKE SURFACE.'
                }
            },
            'styling_pelo': {
                'pillar': 'STYLESCALER',
                'levels': {
                    0: 'Natural messy hair',
                    5: 'Keratin treatment',
                    10: 'L\'OREAL COMMERCIAL HAIR. PERFECT GEOMETRY. ZERO FLYAWAYS.'
                }
            },
            'styling_ropa': {
                'pillar': 'STYLESCALER',
                'levels': {
                    0: 'Natural folds',
                    5: 'Liquid silk',
                    10: 'RE-TAILOR CLOTHING. PERFECT DRAPE. SYNTHESIZE LUXURY FABRIC.'
                }
            },
            'maquillaje': {
                'pillar': 'STYLESCALER',
                'levels': {
                    0: 'No makeup',
                    5: 'Heavy stage makeup',
                    10: 'DRAG CONTOUR. NEON PIGMENTS. SYNTHETIC LASHES.'
                }
            },
            'limpieza_entorno': {
                'pillar': 'STYLESCALER',
                'levels': {
                    0: 'Authentic clutter',
                    5: 'Remove furniture',
                    10: 'DELETE BACKGROUND. INFINITE STUDIO CYCLORAMA. VOID SPACE.'
                }
            },
            'reencuadre_ia': {
                'pillar': 'STYLESCALER',
                'levels': {
                    0: 'Original framing',
                    5: 'Perfect composition',
                    10: 'FORCE FIBONACCI SPIRAL. RE-COMPOSE REALITY.'
                }
            },
            'atmosfera': {
                'pillar': 'STYLESCALER',
                'levels': {
                    0: 'Clear air',
                    5: 'Zero visibility',
                    10: 'SILENT HILL FOG. THICK SMOKE. ETHEREAL GLOW.'
                }
            },
            'look_cine': {
                'pillar': 'STYLESCALER',
                'levels': {
                    0: 'Standard color',
                    5: 'Extreme color shift',
                    10: 'MATRIX GRADE. ACID TRIP PALETTE. CROSS PROCESS.'
                }
            },
            'materiales_pbr': {
                'pillar': 'STYLESCALER',
                'levels': {
                    0: 'Flat textures',
                    5: 'Perfect reflections',
                    10: 'UNREAL ENGINE 5 RENDER. LIQUID METAL. CHROME WORLD.'
                }
            },
            # LIGHTSCALER
            'key_light': {
                'pillar': 'LIGHTSCALER',
                'levels': {
                    0: 'Ambient light',
                    5: 'Blinding stage light',
                    10: 'BLINDING STAGE SPOTLIGHT. PURE DIRECTIONAL BEAM. THEATRICAL.'
                }
            },
            'fill_light': {
                'pillar': 'LIGHTSCALER',
                'levels': {
                    0: 'Natural contrast',
                    5: '360 degree light',
                    10: 'SHADOWLESS WORLD. OVEREXPOSE SHADOWS. PURE WHITE VOID.'
                }
            },
            'rim_light': {
                'pillar': 'LIGHTSCALER',
                'levels': {
                    0: 'No rim',
                    5: 'Tron neon',
                    10: 'TRON NEON OUTLINE. NUCLEAR BACKLIGHT. GLOWING EDGES.'
                }
            },
            'volumetria': {
                'pillar': 'LIGHTSCALER',
                'levels': {
                    0: 'Invisible air',
                    5: 'Solid light beams',
                    10: 'SOLID LIGHT BEAMS. LASER PROJECTION. HEAVENLY LIGHT.'
                }
            },
            'temperatura': {
                'pillar': 'LIGHTSCALER',
                'levels': {
                    0: 'Neutral',
                    5: 'Fire and ice',
                    10: 'FIRE AND ICE. EXTREME KELVIN SHIFT. DUAL TONE NEON.'
                }
            },
            'contraste': {
                'pillar': 'LIGHTSCALER',
                'levels': {
                    0: 'Linear',
                    5: 'Ink shadows',
                    10: 'BINARY BLACK AND WHITE. INK SHADOWS. BLINDING WHITES.'
                }
            },
            'sombras': {
                'pillar': 'LIGHTSCALER',
                'levels': {
                    0: 'Standard grey',
                    5: 'Pure void',
                    10: 'VANTABLACK SHADOWS. PURE VOID. ABYSSAL DARKNESS.'
                }
            },
            'estilo_autor': {
                'pillar': 'LIGHTSCALER',
                'levels': {
                    0: 'Snapshot',
                    5: 'Museum drama',
                    10: 'RENAISSANCE PAINTING. MUSEUM DRAMA. MASTERPIECE.'
                }
            },
            'reflejos': {
                'pillar': 'LIGHTSCALER',
                'levels': {
                    0: 'Matte',
                    5: 'Oiled',
                    10: 'MIRROR SURFACE. CHROME SKIN. LATEX SHINE.'
                }
            },
        }
        
        self._mappings_cache = {
            k: {**v, 'display_name': k.replace('_', ' ').title()}
            for k, v in fallback.items()
        }
        self._loaded = True
        print("BlockInjector: Using fallback mappings")
    
    def _get_instruction_for_level(self, levels: Dict[int, str], value: int) -> str:
        """Obtiene la instrucción más cercana al nivel dado."""
        if value in levels:
            return levels[value]
        
        # Buscar el nivel más cercano inferior
        available = sorted([l for l in levels.keys() if l <= value], reverse=True)
        if available:
            return levels[available[0]]
        
        # Si no hay inferior, buscar superior
        available = sorted([l for l in levels.keys() if l > value])
        if available:
            return levels[available[0]]
        
        return ''
    
    async def translate_sliders_to_instructions(
        self,
        sliders: Dict[str, int]
    ) -> List[SemanticTranslation]:
        """
        Traduce todos los sliders a instrucciones semánticas.
        
        Args:
            sliders: Dict {slider_name: value (0-10)}
        
        Returns:
            Lista de SemanticTranslation
        """
        await self._load_mappings()
        translations = []
        
        for slider_name, value in sliders.items():
            if value <= 0:
                continue
            
            mapping = self._mappings_cache.get(slider_name)
            if not mapping:
                continue
            
            instruction = self._get_instruction_for_level(mapping.get('levels', {}), value)
            if instruction:
                translations.append(SemanticTranslation(
                    slider_name=slider_name,
                    value=value,
                    instruction=instruction,
                    pillar=mapping.get('pillar', 'PHOTOSCALER')
                ))
        
        return translations
    
    async def inject_semantic_blocks(
        self,
        sliders: Dict[str, int],
        translations: List[SemanticTranslation] = None
    ) -> CompilerBlockOutput:
        """
        Inyecta bloques semánticos por pilar.
        
        Args:
            sliders: Dict de sliders
            translations: Traducciones pre-calculadas (opcional)
        
        Returns:
            CompilerBlockOutput con los 3 bloques
        """
        if translations is None:
            translations = await self.translate_sliders_to_instructions(sliders)
        
        blocks = {
            'PHOTOSCALER': [],
            'STYLESCALER': [],
            'LIGHTSCALER': []
        }
        
        # Agrupa las instrucciones por pilar
        for trans in translations:
            pillar = trans.pillar.upper()
            if pillar in blocks:
                blocks[pillar].append(f"- {trans.instruction}")
        
        return CompilerBlockOutput(
            PHOTOSCALER_BLOCK='\n'.join(blocks['PHOTOSCALER']) if blocks['PHOTOSCALER'] else '',
            STYLESCALER_BLOCK='\n'.join(blocks['STYLESCALER']) if blocks['STYLESCALER'] else '',
            LIGHTSCALER_BLOCK='\n'.join(blocks['LIGHTSCALER']) if blocks['LIGHTSCALER'] else ''
        )
    
    async def get_active_instructions(
        self,
        sliders: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Retorna estadísticas de instrucciones activas.
        """
        translations = await self.translate_sliders_to_instructions(sliders)
        
        by_pillar = {'PHOTOSCALER': 0, 'STYLESCALER': 0, 'LIGHTSCALER': 0}
        force_count = 0
        
        for trans in translations:
            pillar = trans.pillar.upper()
            if pillar in by_pillar:
                by_pillar[pillar] += 1
            if trans.value >= 9:
                force_count += 1
        
        return {
            'total_active': len(translations),
            'by_pillar': by_pillar,
            'force_sliders': force_count,
            'translations': [
                {
                    'slider': t.slider_name,
                    'value': t.value,
                    'pillar': t.pillar,
                    'instruction_preview': t.instruction[:100] + '...' if len(t.instruction) > 100 else t.instruction
                }
                for t in translations
            ]
        }


# Instancia singleton
block_injector = BlockInjector()

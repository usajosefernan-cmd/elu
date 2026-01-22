# LuxScaler v28.0 - Smart Presets Service
# Gestión de presets con narrative_anchors y smart_locks

from typing import Dict, List, Optional
from datetime import datetime
from services.supabase_service import supabase_db


class SmartPreset:
    """Representación de un preset inteligente."""
    
    def __init__(
        self,
        id: str,
        name: str,
        slider_values: Dict,
        locked_pillars: List[str] = None,
        narrative_anchor: str = None,
        smart_locks: Dict = None,
        user_id: str = None,
        is_system: bool = False,
        created_at: str = None
    ):
        self.id = id
        self.name = name
        self.slider_values = slider_values
        self.locked_pillars = locked_pillars or []
        self.narrative_anchor = narrative_anchor
        self.smart_locks = smart_locks or {}
        self.user_id = user_id
        self.is_system = is_system
        self.created_at = created_at
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'slider_values': self.slider_values,
            'locked_pillars': self.locked_pillars,
            'narrative_anchor': self.narrative_anchor,
            'smart_locks': self.smart_locks,
            'user_id': self.user_id,
            'is_system': self.is_system,
            'created_at': self.created_at
        }


# System presets (built-in)
SYSTEM_PRESETS: List[SmartPreset] = [
    SmartPreset(
        id='preset_natural',
        name='Natural Light',
        slider_values={
            'photoscaler': {
                'limpieza_artefactos': 4, 'geometria': 2, 'optica': 4,
                'chronos': 2, 'senal_raw': 5, 'sintesis_adn': 3,
                'grano_filmico': 0, 'enfoque': 4, 'resolucion': 3
            },
            'stylescaler': {
                'styling_piel': 3, 'styling_pelo': 3, 'styling_ropa': 2,
                'maquillaje': 1, 'limpieza_entorno': 4, 'reencuadre_ia': 1,
                'atmosfera': 2, 'look_cine': 3, 'materiales_pbr': 2
            },
            'lightscaler': {
                'key_light': 5, 'fill_light': 5, 'rim_light': 2,
                'volumetria': 2, 'temperatura': 5, 'contraste': 4,
                'sombras': 3, 'estilo_autor': 3, 'reflejos': 3
            }
        },
        narrative_anchor='Soft, natural enhancement preserving authentic beauty',
        smart_locks={'identity_lock': 'strict'},
        is_system=True
    ),
    SmartPreset(
        id='preset_editorial',
        name='Editorial Magazine',
        slider_values={
            'photoscaler': {
                'limpieza_artefactos': 7, 'geometria': 5, 'optica': 7,
                'chronos': 4, 'senal_raw': 6, 'sintesis_adn': 5,
                'grano_filmico': 2, 'enfoque': 7, 'resolucion': 6
            },
            'stylescaler': {
                'styling_piel': 7, 'styling_pelo': 6, 'styling_ropa': 5,
                'maquillaje': 5, 'limpieza_entorno': 7, 'reencuadre_ia': 3,
                'atmosfera': 4, 'look_cine': 6, 'materiales_pbr': 5
            },
            'lightscaler': {
                'key_light': 7, 'fill_light': 5, 'rim_light': 5,
                'volumetria': 4, 'temperatura': 5, 'contraste': 6,
                'sombras': 5, 'estilo_autor': 6, 'reflejos': 5
            }
        },
        narrative_anchor='High-end editorial look for fashion and lifestyle',
        smart_locks={'identity_lock': 'moderate', 'max_reencuadre': 5},
        is_system=True
    ),
    SmartPreset(
        id='preset_cinematic',
        name='Cinematic Grade',
        slider_values={
            'photoscaler': {
                'limpieza_artefactos': 5, 'geometria': 3, 'optica': 6,
                'chronos': 3, 'senal_raw': 7, 'sintesis_adn': 4,
                'grano_filmico': 5, 'enfoque': 5, 'resolucion': 5
            },
            'stylescaler': {
                'styling_piel': 5, 'styling_pelo': 4, 'styling_ropa': 4,
                'maquillaje': 3, 'limpieza_entorno': 5, 'reencuadre_ia': 2,
                'atmosfera': 6, 'look_cine': 9, 'materiales_pbr': 6
            },
            'lightscaler': {
                'key_light': 6, 'fill_light': 3, 'rim_light': 6,
                'volumetria': 6, 'temperatura': 4, 'contraste': 7,
                'sombras': 6, 'estilo_autor': 8, 'reflejos': 4
            }
        },
        narrative_anchor='Film look with dramatic lighting and color grading',
        smart_locks={'look_cine': 'min_8'},
        is_system=True
    ),
    SmartPreset(
        id='preset_portrait_pro',
        name='Portrait Pro',
        slider_values={
            'photoscaler': {
                'limpieza_artefactos': 6, 'geometria': 3, 'optica': 7,
                'chronos': 5, 'senal_raw': 5, 'sintesis_adn': 4,
                'grano_filmico': 1, 'enfoque': 7, 'resolucion': 6
            },
            'stylescaler': {
                'styling_piel': 8, 'styling_pelo': 7, 'styling_ropa': 5,
                'maquillaje': 6, 'limpieza_entorno': 6, 'reencuadre_ia': 1,
                'atmosfera': 3, 'look_cine': 5, 'materiales_pbr': 3
            },
            'lightscaler': {
                'key_light': 8, 'fill_light': 6, 'rim_light': 4,
                'volumetria': 2, 'temperatura': 5, 'contraste': 5,
                'sombras': 4, 'estilo_autor': 5, 'reflejos': 4
            }
        },
        narrative_anchor='Professional portrait with flawless skin and studio lighting',
        smart_locks={'identity_lock': 'strict', 'reencuadre_ia': 'max_3'},
        is_system=True
    ),
    SmartPreset(
        id='preset_real_estate',
        name='Real Estate HDR',
        slider_values={
            'photoscaler': {
                'limpieza_artefactos': 7, 'geometria': 10, 'optica': 8,
                'chronos': 2, 'senal_raw': 8, 'sintesis_adn': 3,
                'grano_filmico': 0, 'enfoque': 6, 'resolucion': 7
            },
            'stylescaler': {
                'styling_piel': 1, 'styling_pelo': 1, 'styling_ropa': 1,
                'maquillaje': 0, 'limpieza_entorno': 9, 'reencuadre_ia': 5,
                'atmosfera': 2, 'look_cine': 3, 'materiales_pbr': 7
            },
            'lightscaler': {
                'key_light': 7, 'fill_light': 8, 'rim_light': 2,
                'volumetria': 3, 'temperatura': 5, 'contraste': 6,
                'sombras': 4, 'estilo_autor': 3, 'reflejos': 5
            }
        },
        narrative_anchor='Professional property photography with perfect verticals',
        smart_locks={'geometria': 'min_8', 'identity_lock': 'none'},
        is_system=True
    ),
    SmartPreset(
        id='preset_restoration',
        name='Photo Restoration',
        slider_values={
            'photoscaler': {
                'limpieza_artefactos': 10, 'geometria': 5, 'optica': 6,
                'chronos': 4, 'senal_raw': 7, 'sintesis_adn': 8,
                'grano_filmico': 0, 'enfoque': 8, 'resolucion': 8
            },
            'stylescaler': {
                'styling_piel': 6, 'styling_pelo': 5, 'styling_ropa': 4,
                'maquillaje': 2, 'limpieza_entorno': 7, 'reencuadre_ia': 1,
                'atmosfera': 1, 'look_cine': 2, 'materiales_pbr': 4
            },
            'lightscaler': {
                'key_light': 5, 'fill_light': 5, 'rim_light': 2,
                'volumetria': 1, 'temperatura': 5, 'contraste': 5,
                'sombras': 4, 'estilo_autor': 3, 'reflejos': 3
            }
        },
        narrative_anchor='Forensic restoration of damaged or old photographs',
        smart_locks={'limpieza_artefactos': 'min_8'},
        is_system=True
    )
]


class SmartPresetsService:
    """
    Gestiona presets inteligentes con narrative_anchors y smart_locks.
    """
    
    def __init__(self):
        self._system_presets = {p.id: p for p in SYSTEM_PRESETS}
    
    def get_system_presets(self) -> List[Dict]:
        """Retorna todos los presets del sistema."""
        return [p.to_dict() for p in SYSTEM_PRESETS]
    
    def get_preset_by_id(self, preset_id: str) -> Optional[SmartPreset]:
        """Obtiene un preset por ID (sistema o usuario)."""
        if preset_id in self._system_presets:
            return self._system_presets[preset_id]
        
        # TODO: Buscar en BD de usuario cuando se implemente
        return None
    
    async def get_user_presets(self, user_id: str) -> List[Dict]:
        """Obtiene los presets personalizados de un usuario desde Supabase."""
        try:
            response = supabase_db.client.table("smart_presets")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .execute()
            
            return response.data or []
        except Exception as e:
            print(f"SmartPresetsService: Error getting user presets from Supabase: {e}")
            raise Exception(f"Failed to get user presets: {e}")
    
    async def save_user_preset(
        self, 
        user_id: str, 
        name: str, 
        slider_values: Dict,
        locked_pillars: List[str] = None,
        narrative_anchor: str = None
    ) -> Optional[Dict]:
        """Guarda un nuevo preset para el usuario en Supabase (obligatorio)."""
        try:
            data = {
                'user_id': user_id,
                'name': name,
                'slider_values': slider_values,
                'locked_pillars': locked_pillars or []
            }
            
            # Only add narrative_anchor if provided and column exists
            # For now, we skip it to avoid schema issues
            
            response = supabase_db.client.table("smart_presets")\
                .insert(data)\
                .execute()
            
            if response.data:
                print(f"SmartPresetsService: Saved preset '{name}' for user {user_id}")
                return response.data[0]
            
            raise Exception("No data returned from insert")
            
        except Exception as e:
            print(f"SmartPresetsService: Error saving preset to Supabase: {e}")
            raise Exception(f"Failed to save preset: {e}")
    
    async def delete_user_preset(self, user_id: str, preset_id: str) -> bool:
        """Elimina un preset del usuario desde Supabase (obligatorio)."""
        try:
            response = supabase_db.client.table("smart_presets")\
                .delete()\
                .eq("id", preset_id)\
                .eq("user_id", user_id)\
                .execute()
            
            print(f"SmartPresetsService: Deleted preset {preset_id} for user {user_id}")
            return True
        except Exception as e:
            print(f"SmartPresetsService: Error deleting preset from Supabase: {e}")
            raise Exception(f"Failed to delete preset: {e}")
    
    def apply_smart_locks(self, preset: SmartPreset, slider_config: Dict) -> Dict:
        """
        Aplica los smart_locks del preset a la configuración.
        Retorna la configuración modificada.
        """
        if not preset.smart_locks:
            return slider_config
        
        modified = slider_config.copy()
        
        for lock_key, lock_value in preset.smart_locks.items():
            if lock_key == 'identity_lock':
                # No modifica sliders, pero informa al compilador
                pass
            elif lock_key.startswith('min_'):
                slider_name = lock_key
                min_val = int(lock_value)
                # Aplicar mínimo en todos los pillars
                for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
                    if pillar in modified:
                        sliders = modified[pillar].get('sliders', [])
                        for s in sliders:
                            if s.get('name') == slider_name and s.get('value', 0) < min_val:
                                s['value'] = min_val
            elif lock_key.startswith('max_'):
                slider_name = lock_key.replace('max_', '')
                max_val = int(lock_value)
                for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
                    if pillar in modified:
                        sliders = modified[pillar].get('sliders', [])
                        for s in sliders:
                            if s.get('name') == slider_name and s.get('value', 0) > max_val:
                                s['value'] = max_val
            else:
                # Format: "slider_name": "min_X" or "max_X"
                parts = lock_value.split('_')
                if len(parts) == 2:
                    constraint_type, val = parts
                    val = int(val)
                    for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
                        if pillar in modified:
                            sliders = modified[pillar].get('sliders', [])
                            for s in sliders:
                                if s.get('name') == lock_key:
                                    if constraint_type == 'min' and s.get('value', 0) < val:
                                        s['value'] = val
                                    elif constraint_type == 'max' and s.get('value', 0) > val:
                                        s['value'] = val
        
        return modified
    
    def blend_with_auto(
        self, 
        preset: SmartPreset, 
        auto_settings: Dict,
        blend_factor: float = 0.5
    ) -> Dict:
        """
        Mezcla un preset con la configuración AUTO detectada por visión.
        blend_factor: 0 = 100% preset, 1 = 100% auto
        """
        result = {
            'photoscaler': {'sliders': []},
            'stylescaler': {'sliders': []},
            'lightscaler': {'sliders': []}
        }
        
        for pillar in ['photoscaler', 'stylescaler', 'lightscaler']:
            preset_values = preset.slider_values.get(pillar, {})
            auto_values = auto_settings.get(pillar, {})
            
            # Get all slider names from both
            all_sliders = set(preset_values.keys()) | set(auto_values.keys())
            
            for slider_name in all_sliders:
                preset_val = preset_values.get(slider_name, 5)
                auto_val = auto_values.get(slider_name, 5)
                
                # Linear blend
                blended = int(preset_val * (1 - blend_factor) + auto_val * blend_factor)
                blended = max(0, min(10, blended))  # Clamp 0-10
                
                result[pillar]['sliders'].append({
                    'name': slider_name,
                    'value': blended
                })
        
        return result


smart_presets_service = SmartPresetsService()

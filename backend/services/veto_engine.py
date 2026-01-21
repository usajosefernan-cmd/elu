# LuxScaler v28.0 - Veto Engine
# FASE 4: Resolución de conflictos y reglas de veto

from typing import Dict, List, Callable

class VetoRule:
    """Regla de veto que fuerza valores cuando se cumplen condiciones."""
    def __init__(
        self, 
        name: str, 
        trigger_condition: Callable[[Dict], bool],
        veto_actions: List[Dict]
    ):
        self.name = name
        self.trigger_condition = trigger_condition
        self.veto_actions = veto_actions


# Definición de reglas de veto según documento maestro
VETO_RULES: List[VetoRule] = [
    VetoRule(
        name="La Paradoja Forense",
        trigger_condition=lambda s: s.get('limpieza_artefactos', 0) == 10,
        veto_actions=[
            {
                'slider_name': 'grano_filmico',
                'force_value': 0,
                'reason': 'Limpieza FORCE elimina grano. Grano OFF automático.'
            },
            {
                'slider_name': 'enfoque',
                'force_value': 10,
                'reason': 'Limpieza FORCE activa máxima nitidez.'
            }
        ]
    ),
    VetoRule(
        name="La Tiranía del Drama",
        trigger_condition=lambda s: s.get('contraste', 0) == 10,
        veto_actions=[
            {
                'slider_name': 'fill_light',
                'force_value': 0,
                'reason': 'Contraste FORCE no permite luz de relleno.'
            }
        ]
    ),
    VetoRule(
        name="Paradoja de Geometría",
        trigger_condition=lambda s: s.get('geometria', 0) == 10 and s.get('reencuadre_ia', 0) == 10,
        veto_actions=[
            {
                'slider_name': 'reencuadre_ia',
                'force_value': 0,
                'reason': 'No puedes corregir distorsión Y reencuadrar. Prioridad: Geometría.'
            }
        ]
    ),
    VetoRule(
        name="Claridad vs Atmósfera",
        trigger_condition=lambda s: s.get('optica', 0) >= 9 and s.get('atmosfera', 0) >= 9,
        veto_actions=[
            {
                'slider_name': 'atmosfera',
                'force_value': 5,
                'reason': 'Nitidez extrema requiere atmósfera reducida.'
            }
        ]
    ),
    VetoRule(
        name="Piel Sintética vs Grano",
        trigger_condition=lambda s: s.get('styling_piel', 0) == 10,
        veto_actions=[
            {
                'slider_name': 'grano_filmico',
                'force_value': 0,
                'reason': 'Piel sintética FORCE requiere limpieza total de grano.'
            }
        ]
    ),
    VetoRule(
        name="Cronos Congela Todo",
        trigger_condition=lambda s: s.get('chronos', 0) == 10,
        veto_actions=[
            {
                'slider_name': 'volumetria',
                'force_value': 3,
                'reason': 'Congelar tiempo reduce efectos volumétricos de movimiento.'
            }
        ]
    )
]


class VetoEngine:
    """
    Motor de vetos que resuelve conflictos lógicos entre sliders.
    Aplica reglas de negocio antes de compilar el prompt.
    """
    
    def __init__(self, rules: List[VetoRule] = None):
        self.rules = rules or VETO_RULES
    
    def _flatten_config(self, slider_config: Dict) -> Dict[str, int]:
        """Convierte config estructurada a diccionario plano {slider_name: value}."""
        flat = {}
        
        for pillar_name in ['photoscaler', 'stylescaler', 'lightscaler']:
            pillar_data = slider_config.get(pillar_name, {})
            sliders = pillar_data.get('sliders', [])
            
            if isinstance(sliders, list):
                for s in sliders:
                    flat[s.get('name', '')] = int(s.get('value', 0))
            elif isinstance(sliders, dict):
                for k, v in sliders.items():
                    flat[k] = int(v)
        
        return flat
    
    def _unflatten_config(self, flat: Dict[str, int], original_config: Dict) -> Dict:
        """Reconstruye la config estructurada desde el diccionario plano."""
        result = {}
        
        for pillar_name in ['photoscaler', 'stylescaler', 'lightscaler']:
            pillar_data = original_config.get(pillar_name, {})
            original_sliders = pillar_data.get('sliders', [])
            
            if isinstance(original_sliders, list):
                new_sliders = []
                for s in original_sliders:
                    name = s.get('name', '')
                    new_sliders.append({
                        'name': name,
                        'value': flat.get(name, s.get('value', 0))
                    })
                result[pillar_name] = {'sliders': new_sliders}
            elif isinstance(original_sliders, dict):
                result[pillar_name] = {'sliders': {k: flat.get(k, v) for k, v in original_sliders.items()}}
            else:
                result[pillar_name] = pillar_data
        
        return result
    
    async def apply_vetos(self, slider_config: Dict) -> Dict:
        """
        Aplica todas las reglas de veto a la configuración.
        
        Returns:
            {
                'modified_config': Dict,
                'vetos_applied': [
                    {'rule_name': str, 'actions': [{'slider_name': str, 'original': int, 'forced': int, 'reason': str}]}
                ],
                'total_modifications': int
            }
        """
        flat = self._flatten_config(slider_config)
        vetos_applied = []
        total_modifications = 0
        
        for rule in self.rules:
            try:
                if rule.trigger_condition(flat):
                    actions_taken = []
                    
                    for action in rule.veto_actions:
                        slider_name = action['slider_name']
                        force_value = action['force_value']
                        original_value = flat.get(slider_name, 0)
                        
                        if original_value != force_value:
                            flat[slider_name] = force_value
                            total_modifications += 1
                            actions_taken.append({
                                'slider_name': slider_name,
                                'original': original_value,
                                'forced': force_value,
                                'reason': action['reason']
                            })
                    
                    if actions_taken:
                        vetos_applied.append({
                            'rule_name': rule.name,
                            'actions': actions_taken
                        })
            except Exception as e:
                print(f"VetoEngine: Error evaluating rule '{rule.name}': {e}")
                continue
        
        modified_config = self._unflatten_config(flat, slider_config)
        
        return {
            'modified_config': modified_config,
            'vetos_applied': vetos_applied,
            'total_modifications': total_modifications
        }


veto_engine = VetoEngine()

# LuxScaler v28.0 - Conflict Veto Engine
# FASE 4 PASO 1: Resolución de Jerarquías (Logic Layer)
# Según documento maestro del usuario

from typing import Dict, List, Any, Callable
from dataclasses import dataclass


@dataclass
class VetoAction:
    """Acción de veto que fuerza un valor en un slider."""
    slider_name: str
    force_value: int
    reason: str


@dataclass
class VetoRule:
    """Regla de veto con condición de disparo y acciones."""
    name: str
    trigger_condition: Callable[[Dict[str, int]], bool]
    veto_actions: List[VetoAction]


# =====================================================
# REGLAS DE ORO (VETOS) - Según documento maestro v29
# =====================================================

VETO_RULES: List[VetoRule] = [
    # REGLA ORIGINAL 1: La Paradoja Forense
    VetoRule(
        name="La Paradoja Forense",
        trigger_condition=lambda s: s.get('limpieza_artefactos', 0) == 10,
        veto_actions=[
            VetoAction(
                slider_name='grano_filmico',
                force_value=0,
                reason="Limpieza FORCE mata lo vintage. Grano OFF."
            ),
            VetoAction(
                slider_name='optica_nitidez',
                force_value=10,
                reason="Limpieza FORCE fuerza máxima nitidez."
            ),
        ]
    ),
    # REGLA ORIGINAL 2: La Tiranía del Drama
    VetoRule(
        name="La Tiranía del Drama",
        trigger_condition=lambda s: s.get('dramatismo_contraste', 0) == 10,
        veto_actions=[
            VetoAction(
                slider_name='luz_relleno',
                force_value=0,
                reason="Drama FORCE no permite fill light. Contraste absoluto."
            ),
        ]
    ),
    # REGLA ORIGINAL 3: Paradoja de Geometría
    VetoRule(
        name="Paradoja de Geometría",
        trigger_condition=lambda s: (
            (s.get('geometria_distorsion', 0) == 10 or s.get('geometria', 0) == 10) and 
            s.get('reencuadre_ia', 0) == 10
        ),
        veto_actions=[
            VetoAction(
                slider_name='reencuadre_ia',
                force_value=0,
                reason="No puedes corregir distorsión Y reencuadrar a la vez. Priority: Distorsión."
            ),
        ]
    ),
    # NUEVA REGLA v29: Atmósfera mata Nitidez
    VetoRule(
        name="Niebla vs Nitidez",
        trigger_condition=lambda s: s.get('atmosfera', 0) > 5,
        veto_actions=[
            VetoAction(
                slider_name='optica',
                force_value=0,
                reason="Atmósfera alta anula Nitidez/Optica - no puedes tener niebla Y nitidez."
            ),
            VetoAction(
                slider_name='optica_nitidez',
                force_value=0,
                reason="Atmósfera alta anula Nitidez."
            ),
            VetoAction(
                slider_name='enfoque',
                force_value=0,
                reason="Atmósfera alta anula Enfoque - la niebla difumina todo."
            ),
        ]
    ),
    # NUEVA REGLA v29: High Key mata Sombras
    VetoRule(
        name="High Key vs Vantablack",
        trigger_condition=lambda s: s.get('fill_light', 0) > 6 or s.get('luz_relleno', 0) > 6,
        veto_actions=[
            VetoAction(
                slider_name='sombras',
                force_value=0,
                reason="High Key (fill light alto) anula Vantablack/Sombras oscuras."
            ),
        ]
    ),
    # NUEVA REGLA v29: High Key limita Contraste
    VetoRule(
        name="High Key Limita Contraste",
        trigger_condition=lambda s: s.get('fill_light', 0) > 6 or s.get('luz_relleno', 0) > 6,
        veto_actions=[
            VetoAction(
                slider_name='contraste',
                force_value=5,  # Limita a 5 máximo
                reason="High Key limita contraste máximo a 5."
            ),
        ]
    ),
    # NUEVA REGLA v29: Look Cine vs Estilo Autor (prioridad al más alto)
    VetoRule(
        name="Cine vs Autor - Prioridad Cine",
        trigger_condition=lambda s: (
            s.get('look_cine', 0) > 0 and 
            s.get('estilo_autor', 0) > 0 and
            s.get('look_cine', 0) >= s.get('estilo_autor', 0)
        ),
        veto_actions=[
            VetoAction(
                slider_name='estilo_autor',
                force_value=0,
                reason="Look Cine y Estilo Autor son incompatibles. Prioridad: Cine (valor más alto)."
            ),
        ]
    ),
    VetoRule(
        name="Cine vs Autor - Prioridad Autor",
        trigger_condition=lambda s: (
            s.get('look_cine', 0) > 0 and 
            s.get('estilo_autor', 0) > 0 and
            s.get('estilo_autor', 0) > s.get('look_cine', 0)
        ),
        veto_actions=[
            VetoAction(
                slider_name='look_cine',
                force_value=0,
                reason="Look Cine y Estilo Autor son incompatibles. Prioridad: Autor (valor más alto)."
            ),
        ]
    ),
    # REGLA: Claridad vs Atmósfera
    VetoRule(
        name="Claridad vs Atmósfera",
        trigger_condition=lambda s: (
            s.get('optica', 0) >= 9 and 
            s.get('atmosfera', 0) >= 9
        ),
        veto_actions=[
            VetoAction(
                slider_name='atmosfera',
                force_value=5,
                reason="Nitidez extrema requiere atmósfera reducida."
            ),
        ]
    ),
    # REGLA: Piel Sintética vs Grano
    VetoRule(
        name="Piel Sintética vs Grano",
        trigger_condition=lambda s: s.get('styling_piel', 0) == 10,
        veto_actions=[
            VetoAction(
                slider_name='grano_filmico',
                force_value=0,
                reason="Piel sintética FORCE requiere limpieza total de grano."
            ),
        ]
    ),
    # REGLA: Cronos Congela Todo
    VetoRule(
        name="Cronos Congela Todo",
        trigger_condition=lambda s: s.get('chronos', 0) == 10,
        veto_actions=[
            VetoAction(
                slider_name='volumetria',
                force_value=3,
                reason="Congelar tiempo reduce efectos volumétricos de movimiento."
            ),
        ]
    ),
    # REGLA: Síntesis ADN vs Preservación
    VetoRule(
        name="Síntesis ADN vs Preservación",
        trigger_condition=lambda s: s.get('sintesis_adn', 0) == 10,
        veto_actions=[
            VetoAction(
                slider_name='limpieza_artefactos',
                force_value=8,
                reason="Síntesis máxima requiere limpieza agresiva del material base."
            ),
        ]
    ),
    # NUEVA REGLA v29: Volumetría requiere Atmósfera
    VetoRule(
        name="Volumetría sin Atmósfera",
        trigger_condition=lambda s: s.get('volumetria', 0) > 7 and s.get('atmosfera', 0) < 3,
        veto_actions=[
            VetoAction(
                slider_name='atmosfera',
                force_value=4,
                reason="Volumetría alta necesita atmósfera para rayos de luz visibles."
            ),
        ]
    ),
]


class ConflictVetoEngine:
    """
    Motor de resolución de conflictos (Veto Engine).
    
    Detecta conflictos lógicos y aplica "Vetos" antes de generar texto.
    Paso 1 del algoritmo PromptCompilerService.
    """
    
    def __init__(self, rules: List[VetoRule] = None):
        self.rules = rules or VETO_RULES
    
    async def apply_veto_rules(
        self, 
        sliders: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Aplica todas las reglas de veto a la configuración de sliders.
        
        Args:
            sliders: Diccionario plano {slider_name: value (0-10)}
        
        Returns:
            {
                'modified_sliders': Dict[str, int],
                'vetos_applied': List[Dict],
                'total_modifications': int
            }
        """
        modified_sliders = sliders.copy()
        vetos_applied = []
        total_modifications = 0
        
        for rule in self.rules:
            try:
                if rule.trigger_condition(modified_sliders):
                    actions_taken = []
                    
                    for action in rule.veto_actions:
                        original_value = modified_sliders.get(action.slider_name, 0)
                        
                        # Solo modificar si el valor es diferente
                        if original_value != action.force_value:
                            modified_sliders[action.slider_name] = action.force_value
                            total_modifications += 1
                            
                            actions_taken.append({
                                'slider_name': action.slider_name,
                                'original_value': original_value,
                                'forced_value': action.force_value,
                                'reason': action.reason
                            })
                    
                    if actions_taken:
                        vetos_applied.append({
                            'rule_name': rule.name,
                            'actions': actions_taken
                        })
                        
            except Exception as e:
                print(f"ConflictVetoEngine: Error evaluating rule '{rule.name}': {e}")
                continue
        
        return {
            'modified_sliders': modified_sliders,
            'vetos_applied': vetos_applied,
            'total_modifications': total_modifications
        }
    
    def add_rule(self, rule: VetoRule):
        """Añade una regla de veto dinámica."""
        self.rules.append(rule)
    
    def get_rules_summary(self) -> List[Dict]:
        """Retorna un resumen de las reglas configuradas."""
        return [
            {
                'name': rule.name,
                'actions_count': len(rule.veto_actions)
            }
            for rule in self.rules
        ]


# Instancia singleton
conflict_veto_engine = ConflictVetoEngine()

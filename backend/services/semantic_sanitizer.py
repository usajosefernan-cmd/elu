# LuxScaler v28.0 - Semantic Sanitizer Service
# FASE 4 PASO 3: El Sanitizador Semántico (Final Polish)
# Según documento maestro del usuario

from typing import Dict, List, Any
from dataclasses import dataclass
import re


@dataclass
class SanitizationResult:
    """Resultado de la sanitización."""
    prompt: str
    redundancies_removed: int
    empty_sections_removed: List[str]
    lines_before: int
    lines_after: int


class SemanticSanitizer:
    """
    Sanitizador semántico para optimizar prompts para Gemini 3 Pro.
    
    Responsabilidades:
    - Quitar redundancias
    - Eliminar secciones vacías
    - Formatear correctamente
    - Optimizar para el modelo
    
    Paso 3 del algoritmo PromptCompilerService.
    """
    
    def __init__(self):
        # Patrones de secciones vacías a eliminar
        self.empty_patterns = [
            r'=== LIGHTING & TONE ===\s*\n\s*=== NEGATIVE PROMPT ===',
            r'GEOMETRY & RESTORATION:\s*\n\s*\n',
            r'LIGHTING & TONE:\s*\n\s*\n',
            r'\[Standard styling\]\s*\n',
            r'\[Standard processing\]\s*\n',
            r'\[Natural lighting\]\s*\n',
            r'=== PHASE \d+: [^=]+ ===\s*\n\s*=== PHASE',
        ]
        
        # Frases redundantes comunes a consolidar
        self.redundancy_phrases = [
            '8k resolution',
            'high quality',
            'professional quality',
            'high detail',
            'ultra detail',
            'maximum quality',
        ]
    
    async def sanitize_semantic_prompt(
        self,
        template: str,
        blocks: Dict[str, str],
        vision_analysis: Dict[str, Any] = None
    ) -> SanitizationResult:
        """
        Sanitiza y optimiza el prompt final.
        
        Args:
            template: Template del prompt con placeholders
            blocks: Dict con PHOTOSCALER_BLOCK, STYLESCALER_BLOCK, LIGHTSCALER_BLOCK
            vision_analysis: Análisis de visión (opcional)
        
        Returns:
            SanitizationResult
        """
        prompt = template
        lines_before = len(prompt.split('\n'))
        redundancies_removed = 0
        empty_sections_removed = []
        
        # PASO 1: Inyecta bloques dinámicos
        prompt = prompt.replace('{{PHOTOSCALER_BLOCK}}', blocks.get('PHOTOSCALER_BLOCK', ''))
        prompt = prompt.replace('{{STYLESCALER_BLOCK}}', blocks.get('STYLESCALER_BLOCK', ''))
        prompt = prompt.replace('{{LIGHTSCALER_BLOCK}}', blocks.get('LIGHTSCALER_BLOCK', ''))
        
        # Inyectar análisis de visión si existe
        if vision_analysis:
            vision_summary = self._format_vision_summary(vision_analysis)
            prompt = prompt.replace('{{VISION_ANALYSIS_SUMMARY}}', vision_summary)
        else:
            prompt = prompt.replace('{{VISION_ANALYSIS_SUMMARY}}', '')
        
        # PASO 2: Elimina secciones vacías
        for pattern in self.empty_patterns:
            if re.search(pattern, prompt):
                prompt = re.sub(pattern, '', prompt)
                empty_sections_removed.append(pattern)
        
        # PASO 3: Elimina líneas duplicadas
        lines = prompt.split('\n')
        seen = set()
        unique_lines = []
        
        for line in lines:
            normalized = line.strip().lower()
            
            # Líneas vacías siempre se permiten (hasta 2 consecutivas)
            if not normalized:
                if unique_lines and not unique_lines[-1].strip():
                    # Ya hay una línea vacía, no agregar otra
                    redundancies_removed += 1
                    continue
                unique_lines.append(line)
                continue
            
            # Líneas con contenido - verificar duplicados
            if normalized not in seen:
                seen.add(normalized)
                unique_lines.append(line)
            else:
                redundancies_removed += 1
        
        prompt = '\n'.join(unique_lines)
        
        # PASO 4: Limpia espacios múltiples
        prompt = re.sub(r'\n{3,}', '\n\n', prompt)
        prompt = re.sub(r' {2,}', ' ', prompt)
        
        # PASO 5: Asegura formato correcto
        prompt = prompt.strip()
        
        lines_after = len(prompt.split('\n'))
        
        return SanitizationResult(
            prompt=prompt,
            redundancies_removed=redundancies_removed,
            empty_sections_removed=empty_sections_removed,
            lines_before=lines_before,
            lines_after=lines_after
        )
    
    def _format_vision_summary(self, vision_analysis: Dict[str, Any]) -> str:
        """Formatea el análisis de visión para el prompt."""
        parts = []
        
        # Categoría detectada
        category = vision_analysis.get('category', 'UNKNOWN')
        parts.append(f"Detected Category: {category}")
        
        # Diagnóstico técnico
        tech = vision_analysis.get('technical_diagnosis', {})
        if tech:
            noise = tech.get('noise_level', 'N/A')
            blur = tech.get('blur_level', 'N/A')
            exposure = tech.get('exposure_level', 'N/A')
            parts.append(f"Technical: Noise={noise}, Blur={blur}, Exposure={exposure}")
        
        # Target de producción
        prod = vision_analysis.get('production_analysis', {})
        if prod:
            target = prod.get('target_vision', '')
            if target:
                parts.append(f"Target Vision: {target}")
        
        # Alertas de protocolo
        alerts = vision_analysis.get('protocol_alerts', [])
        if alerts:
            parts.append(f"Protocol Alerts: {', '.join(alerts)}")
        
        return '\n'.join(parts)
    
    def quick_sanitize(self, text: str) -> str:
        """
        Sanitización rápida para textos cortos.
        Solo elimina duplicados y limpia espacios.
        """
        lines = text.split('\n')
        seen = set()
        unique = []
        
        for line in lines:
            normalized = line.strip()
            if not normalized or normalized not in seen:
                if normalized:
                    seen.add(normalized)
                unique.append(line)
        
        result = '\n'.join(unique)
        result = re.sub(r'\n{3,}', '\n\n', result)
        return result.strip()
    
    def validate_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        Valida que el prompt cumple con requisitos mínimos.
        """
        issues = []
        
        # Verificar longitud
        if len(prompt) < 100:
            issues.append("Prompt muy corto (< 100 caracteres)")
        
        if len(prompt) > 50000:
            issues.append("Prompt muy largo (> 50000 caracteres)")
        
        # Verificar secciones requeridas
        required_sections = [
            'IDENTITY LOCK',
            'NEGATIVE PROMPT',
        ]
        
        for section in required_sections:
            if section not in prompt:
                issues.append(f"Falta sección: {section}")
        
        # Verificar bloques
        has_photoscaler = 'PHOTOSCALER' in prompt or 'GEOMETRY' in prompt
        has_stylescaler = 'STYLESCALER' in prompt or 'SUBJECT' in prompt
        has_lightscaler = 'LIGHTSCALER' in prompt or 'LIGHTING' in prompt
        
        if not any([has_photoscaler, has_stylescaler, has_lightscaler]):
            issues.append("No se detectaron bloques de pilares")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'char_count': len(prompt),
            'line_count': len(prompt.split('\n')),
            'estimated_tokens': len(prompt) // 4  # Aproximación
        }


# Instancia singleton
semantic_sanitizer = SemanticSanitizer()

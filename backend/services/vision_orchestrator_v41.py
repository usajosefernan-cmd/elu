# LuxScaler v41 - Vision Orchestrator Service
# Clasifica imágenes usando taxonomy y diagnosis desde Supabase

from typing import Dict, List, Optional, Any
from services.supabase_service import supabase_db
from services.gemini_service import gemini_service
import json


class VisionOrchestratorService:
    """
    Vision Orchestrator v41:
    1. Analiza imagen con Gemini Vision
    2. Clasifica usando taxonomy_definitions (21 categorías)
    3. Detecta defectos usando diagnosis_definitions (10 diagnósticos)
    4. Ensambla auto_settings mezclando taxonomy + diagnosis
    """
    
    def __init__(self):
        self.version = "41.0"
    
    async def load_definitions_from_db(self):
        """Carga taxonomy y diagnosis desde Supabase"""
        try:
            # Cargar taxonomías
            tax_response = supabase_db.client.table('taxonomy_definitions')\
                .select('*')\
                .execute()
            
            # Cargar diagnósticos
            diag_response = supabase_db.client.table('diagnosis_definitions')\
                .select('*')\
                .execute()
            
            taxonomies = tax_response.data or []
            diagnosis_list = diag_response.data or []
            
            print(f"[VisionOrchestrator] Loaded {len(taxonomies)} taxonomies, {len(diagnosis_list)} diagnosis from Supabase")
            
            return taxonomies, diagnosis_list
            
        except Exception as e:
            print(f"[VisionOrchestrator] Error loading definitions: {e}")
            return [], []
    
    def build_vision_context(self, taxonomies: List, diagnosis_list: List) -> str:
        """Construye el contexto para Gemini Vision"""
        
        tax_context = '\n'.join([
            f"- CODE: {t['code']} ({t['category_name']}) >> VISUAL CUES: {t['visual_description']}"
            for t in taxonomies
        ])
        
        diag_context = '\n'.join([
            f"- CODE: {d['code']} ({d['diagnosis_name']}) >> DEFECT TRAITS: {d['visual_description']}"
            for d in diagnosis_list
        ])
        
        system_prompt = f"""
### SYSTEM IDENTITY & MISSION
You are the **Lead Visual Forensics Director** for "LuxScaler", a high-end AI engine.

**YOUR GOAL:** Audit the raw input pixels to determine:
1. What TYPE of image is this? (Category)
2. What DEFECTS does it have? (Diagnosis)
3. How SEVERE is the damage? (1-10 score)

**REFERENCE DATA:**

1. TAXONOMY (What is the subject?):
{tax_context}

2. DIAGNOSIS (What is broken?):
{diag_context}

Return strictly this JSON (no markdown):
{{
  "cat_code": "CATxx",
  "detected_defects": ["INxx"],
  "has_text_or_logo": boolean,
  "severity_score": 1-10,
  "visual_summary": "One sentence description",
  "reasoning": "Explain your classification"
}}"""
        
        return system_prompt
    
    async def orchestrate_vision_analysis(
        self,
        image_base64: str,
        user_id: str,
        upload_id: str
    ) -> Dict[str, Any]:
        """
        Orquesta el análisis completo de una imagen:
        1. Clasifica con Gemini Vision
        2. Ensambla auto_settings desde taxonomy + diagnosis
        3. Guarda en analysis_results
        """
        try:
            # Cargar definiciones
            taxonomies, diagnosis_list = await self.load_definitions_from_db()
            
            if not taxonomies:
                return {"error": "No taxonomy definitions loaded"}
            
            # Construir contexto
            system_prompt = self.build_vision_context(taxonomies, diagnosis_list)
            
            # Llamar a Gemini Vision
            print(f"[VisionOrchestrator] Calling Gemini Vision...")
            
            # Usar gemini-2.5-flash para vision
            vision_result = await gemini_service.analyze_with_vision(
                image_base64,
                system_prompt,
                model="gemini-2.5-flash"
            )
            
            # Parsear respuesta JSON
            if isinstance(vision_result, str):
                vision_result = json.loads(vision_result.replace('```json', '').replace('```', '').strip())
            
            print(f"[VisionOrchestrator] Classification: {vision_result.get('cat_code')} with defects: {vision_result.get('detected_defects')}")
            
            # Ensamblar auto_settings desde taxonomy + diagnosis
            final_sliders = {}
            
            # Aplicar config de taxonomy
            cat_code = vision_result.get('cat_code')
            cat_rule = next((t for t in taxonomies if t['code'] == cat_code), None)
            
            if cat_rule and cat_rule.get('slider_config'):
                final_sliders.update(cat_rule['slider_config'])
            
            # Aplicar configs de diagnosis
            detected_defects = vision_result.get('detected_defects', [])
            for defect_code in detected_defects:
                diag_rule = next((d for d in diagnosis_list if d['code'] == defect_code), None)
                if diag_rule and diag_rule.get('slider_config'):
                    # Merge (el último gana si hay conflicto)
                    final_sliders.update(diag_rule['slider_config'])
            
            # Severity boost
            severity = vision_result.get('severity_score', 5)
            if severity > 7:
                final_sliders['force_reimagine'] = True
                final_sliders['p6'] = 'FORCE'
            
            # OCR lock
            if vision_result.get('has_text_or_logo'):
                final_sliders['ocr_lock'] = True
                final_sliders['l6'] = 'FORCE'
            
            # Guardar en analysis_results
            analysis_data = {
                'upload_id': upload_id,
                'cat_code': cat_code,
                'detected_defects': detected_defects,
                'ocr_data': vision_result.get('ocr_data'),
                'visual_summary': vision_result.get('visual_summary'),
                'severity_score': severity,
                'auto_settings': final_sliders
            }
            
            await supabase_db.client.table('analysis_results').upsert(analysis_data).execute()
            
            print(f"[VisionOrchestrator] Analysis saved. Auto settings: {len(final_sliders)} sliders configured")
            
            return {
                'success': True,
                'analysis': vision_result,
                'auto_settings': final_sliders,
                'cat_name': cat_rule.get('category_name') if cat_rule else 'UNKNOWN',
                'strategy': cat_rule.get('strategy') if cat_rule else ''
            }
            
        except Exception as e:
            print(f"[VisionOrchestrator] Error: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e)}


# Singleton
vision_orchestrator = VisionOrchestratorService()

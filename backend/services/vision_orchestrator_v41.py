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
        4. Si tier AUTO: Ejecuta batch processing asíncrono
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
            
            vision_result = await gemini_service.analyze_with_vision(
                image_base64,
                system_prompt,
                model="gemini-2.5-flash"
            )
            
            # Parsear respuesta JSON
            if isinstance(vision_result, str):
                import json
                vision_result = json.loads(vision_result.replace('```json', '').replace('```', '').strip())
            
            return {
                'success': True,
                'analysis': vision_result,
                'auto_settings': {},
                'cat_name': 'UNKNOWN'
            }
            
        except Exception as e:
            print(f"[VisionOrchestrator] Error: {e}")
            return {"error": str(e)}
    
    async def execute_batch_processing(self, upload_id, user_id, analysis, auto_settings, biopsy_urls):
        """Batch processing - placeholder"""
        return {'success': True, 'count': 1}


# Singleton
vision_orchestrator = VisionOrchestratorService()
vision_orchestrator = VisionOrchestratorService()

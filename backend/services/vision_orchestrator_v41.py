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
                vision_result = json.loads(vision_result.replace('```json', '').replace('```', '').strip())
            
            print(f"[VisionOrchestrator] Classification: {vision_result.get('cat_code')} with defects: {vision_result.get('detected_defects')}")
            
            # Ensamblar auto_settings desde taxonomy + diagnosis
            final_sliders = {}
            
            cat_code = vision_result.get('cat_code')
            cat_rule = next((t for t in taxonomies if t['code'] == cat_code), None)
            
            if cat_rule and cat_rule.get('slider_config'):
                final_sliders.update(cat_rule['slider_config'])
            
            detected_defects = vision_result.get('detected_defects', [])
            for defect_code in detected_defects:
                diag_rule = next((d for d in diagnosis_list if d['code'] == defect_code), None)
                if diag_rule and diag_rule.get('slider_config'):
                    final_sliders.update(diag_rule['slider_config'])
            
            severity = vision_result.get('severity_score', 5)
            if severity > 7:
                final_sliders['force_reimagine'] = True
                final_sliders['p6'] = 'FORCE'
            
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



# Singleton actualizado con batch processing
vision_orchestrator = VisionOrchestratorService()

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
    
    async def execute_batch_processing(
        self,
        upload_id: str,
        user_id: str,
        analysis: Dict,
        auto_settings: Dict,
        biopsy_urls: Dict
    ) -> Dict:
        """
        Ejecuta batch processing asíncrono ("Shoot, Pocket, Review").
        
        1. Lee user_upload_workflows
        2. Genera múltiples variantes con Smart Staggering
        3. Diferentes seeds y temperatures para variedad
        """
        try:
            # Cargar workflow del usuario
            workflow_response = supabase_db.client.table('user_upload_workflows')\
                .select('*')\
                .eq('user_id', user_id)\
                .execute()
            
            workflow = workflow_response.data[0] if workflow_response.data else None
            
            # Batch config por defecto
            batch_config = [
                {'type': 'AUTO', 'variant': 'FORENSIC'},
                {'type': 'AUTO', 'variant': 'CREATIVE'}
            ]
            
            if workflow and workflow.get('batch_config'):
                batch_config = workflow['batch_config']
                max_previews = workflow.get('max_previews', 3)
                batch_config = batch_config[:max_previews]
            
            print(f"[BatchProcessing] Starting {len(batch_config)} variations with Smart Staggering")
            
            from services.prompt_compiler_v41 import prompt_compiler_v41
            from services.laozhang_service import laozhang_service
            import random
            import asyncio
            
            # Jobs para procesamiento
            results = []
            
            for index, item in enumerate(batch_config):
                try:
                    # A. Configurar variedad
                    specific_settings = {**auto_settings}
                    temp_override = 0.4
                    seed_override = random.randint(100000, 999999)
                    preset_data = None
                    
                    if item.get('type') == 'PRESET':
                        # Cargar preset
                        preset_response = supabase_db.client.table('user_presets_v41')\
                            .select('*')\
                            .eq('id', item.get('preset_id'))\
                            .single()\
                            .execute()
                        
                        if preset_response.data:
                            preset = preset_response.data
                            specific_settings = preset.get('sliders_config', specific_settings)
                            temp_override = preset.get('nano_params', {}).get('strength', 0.65)
                            preset_data = preset
                    
                    elif item.get('type') == 'AUTO':
                        variant = item.get('variant', 'BALANCED')
                        if variant == 'FORENSIC':
                            temp_override = 0.1
                            seed_override = 42  # Seed fija para forensic
                        elif variant == 'CREATIVE':
                            temp_override = 0.8
                        else:
                            temp_override = 0.4 + (index * 0.1)
                    
                    # B. Compilar prompt
                    compile_result = await prompt_compiler_v41.compile_from_sliders(
                        specific_settings,
                        analysis,
                        analysis.get('has_person', False)
                    )
                    
                    if not compile_result.get('success'):
                        print(f"[BatchProcessing] Compilation failed for variant {index}")
                        continue
                    
                    # C. Generar con LaoZhang
                    gen_config = {
                        'temperature': temp_override,
                        'seed': seed_override,
                        'image_size': '4K'
                    }
                    
                    # Si hay preset con anchors
                    if preset_data and preset_data.get('anchor_preferences'):
                        gen_config['preset'] = preset_data
                    
                    # Usar center crop o thumbnail
                    image_data = biopsy_urls.get('center_base64') or biopsy_urls.get('thumbnail_base64')
                    
                    gen_result = await laozhang_service.generate_with_nano_banana_pro(
                        prompt=compile_result['compiled_prompt'],
                        image_base64=image_data,
                        config=gen_config
                    )
                    
                    if gen_result.get('success'):
                        # Guardar en generations
                        gen_data = {
                            'upload_id': upload_id,
                            'prompt_used': compile_result['compiled_prompt'][:1000],
                            'config_used': {
                                'seed': seed_override,
                                'temperature': temp_override,
                                'variant': item.get('variant'),
                                'preset_id': preset_data.get('id') if preset_data else None
                            },
                            'watermarked_url': gen_result.get('image_base64'),
                            'is_preview': True,
                            'tokens_spent': 0
                        }
                        
                        gen_response = await supabase_db.client.table('generations').insert(gen_data).execute()
                        
                        results.append({
                            'index': index,
                            'variant': item.get('variant'),
                            'success': True,
                            'generation_id': gen_response.data[0]['id'] if gen_response.data else None
                        })
                        
                        print(f"[BatchProcessing] ✅ Variant {index+1}/{len(batch_config)} completed")
                    
                    # D. HEARTBEAT DELAY (Smart Staggering)
                    if index < len(batch_config) - 1:
                        print(f"[BatchProcessing] ⏱️ Heartbeat delay 1.5s...")
                        await asyncio.sleep(1.5)
                
                except Exception as e:
                    print(f"[BatchProcessing] Error in variant {index}: {e}")
                    results.append({
                        'index': index,
                        'success': False,
                        'error': str(e)
                    })
            
            # Actualizar upload status
            await supabase_db.client.table('uploads')\
                .update({'status': 'completed'})\
                .eq('id', upload_id)\
                .execute()
            
            print(f"[BatchProcessing] 🎉 Batch completed: {len(results)} variations")
            
            return {
                'success': True,
                'count': len(results),
                'results': results,
                'message': 'Generations queued in background. You can close the app.'
            }
            
        except Exception as e:
            print(f"[BatchProcessing] Error: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e)}


# Singleton
vision_orchestrator = VisionOrchestratorService()

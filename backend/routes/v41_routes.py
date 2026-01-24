from fastapi import APIRouter, HTTPException, Body
from services.supabase_service import supabase_db
from services.vision_orchestrator_v41 import vision_orchestrator
from services.prompt_compiler_v41 import prompt_compiler_v41
from services.gemini_service import gemini_service
import uuid

router = APIRouter(prefix="/v41", tags=["v41"])


@router.post("/vision-orchestrator")
async def vision_orchestrator_endpoint(body: dict = Body(...)):
    """
    Vision Orchestrator v41
    
    Analiza imagen y clasifica usando taxonomy + diagnosis desde Supabase.
    
    Request:
    {
        "userId": "uuid",
        "biopsyUrls": {
            "thumbnail_base64": "...",
            "center_base64": "...",
            "shadow_base64": "...",
            "detail_base64": "...",
            "originalWidth": 4000,
            "originalHeight": 3000
        }
    }
    
    Response:
    - AUTO tier: {"status": "BATCH_PROCESSING", "count": 3, "analysis": {...}}
    - USER/PRO: {"status": "REVIEW_REQUIRED", "analysis": {...}, "final_prescription": {...}}
    """
    try:
        user_id = body.get('userId')
        biopsy_urls = body.get('biopsyUrls', {})
        
        if not user_id or not biopsy_urls:
            return {"success": False, "error": "Missing userId or biopsyUrls"}
        
        # Crear registro de upload
        upload_id = str(uuid.uuid4())
        
        upload_data = {
            'id': upload_id,
            'user_id': user_id,
            'original_width': biopsy_urls.get('originalWidth'),
            'original_height': biopsy_urls.get('originalHeight'),
            'biopsy_urls': biopsy_urls,
            'status': 'analyzing'
        }
        
        await supabase_db.client.table('uploads').insert(upload_data).execute()
        
        # Obtener perfil y tier del usuario
        profile_response = supabase_db.client.table('profiles')\
            .select('tier, token_balance')\
            .eq('id', user_id)\
            .execute()
        
        tier_code = 'AUTO'  # Default
        token_balance = 100
        
        if profile_response.data and len(profile_response.data) > 0:
            tier_code = profile_response.data[0].get('tier', 'AUTO')
            token_balance = profile_response.data[0].get('token_balance', 100)
        
        # Obtener tier config
        tier_response = supabase_db.client.table('tier_config')\
            .select('*')\
            .eq('tier_code', tier_code)\
            .execute()
        
        tier_config = tier_response.data[0] if tier_response.data else {}
        
        # Ejecutar análisis de vision
        thumbnail_base64 = biopsy_urls.get('thumbnail_base64', '')
        
        result = await vision_orchestrator.orchestrate_vision_analysis(
            thumbnail_base64,
            user_id,
            upload_id
        )
        
        if not result.get('success'):
            return {"success": False, "error": result.get('error', 'Vision analysis failed')}
        
        # Determinar respuesta según tier
        if tier_code == 'AUTO':
            # AUTO: Batch processing automático
            # TODO: Implementar batch generation
            return {
                "status": "BATCH_PROCESSING",
                "uploadId": upload_id,
                "count": tier_config.get('batch_size_limit', 1),
                "analysis": result['analysis'],
                "auto_settings": result['auto_settings']
            }
        else:
            # USER/PRO/PRO_LUX: Review required
            return {
                "status": "REVIEW_REQUIRED",
                "uploadId": upload_id,
                "analysis": result['analysis'],
                "final_prescription": result['auto_settings'],
                "can_refine": tier_config.get('can_refine', False),
                "can_upscale_8k": tier_config.get('can_upscale_8k', False),
                "tier": tier_code,
                "token_balance": token_balance
            }
        
    except Exception as e:
        print(f"[VisionOrchestrator Endpoint] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/prompt-compiler")
async def prompt_compiler_endpoint(body: dict = Body(...)):
    """
    Prompt Compiler v41
    
    Ensambla prompt desde slider_config usando slider_definitions de Supabase.
    
    Request:
    {
        "visionResult": {...},
        "sliderConfig": {p1: 5, p3: 9, s1: 7, ...},
        "savedPreset": {seed: 123, temperature: 0.4},
        "userMode": "pro"
    }
    
    Response:
    {
        "compiled_prompt": "...",
        "generation_config": {seed, strength, guidance_scale, sampler}
    }
    """
    try:
        vision_result = body.get('visionResult', {})
        slider_config = body.get('sliderConfig', {})
        saved_preset = body.get('savedPreset', {})
        user_mode = body.get('userMode', 'auto')
        
        # Detectar si hay persona
        has_person = vision_result.get('has_person', False)
        
        # Compilar prompt
        result = await prompt_compiler_v41.compile_from_sliders(
            slider_config,
            vision_result,
            has_person
        )
        
        if not result.get('success'):
            return {"success": False, "error": result.get('error', 'Compilation failed')}
        
        # Configuración de generación
        temperature = saved_preset.get('temperature', 0.4)
        seed = saved_preset.get('seed', None)
        
        generation_config = {
            'seed': seed if seed else None,
            'temperature': temperature,
            'top_k': 40,
            'top_p': 0.9
        }
        
        return {
            "success": True,
            "compiled_prompt": result['compiled_prompt'],
            "generation_config": generation_config,
            "metadata": result['metadata']
        }
        
    except Exception as e:
        print(f"[PromptCompiler Endpoint] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@router.post("/generate")
async def generate_v41_endpoint(body: dict = Body(...)):
    """
    Generate v41
    
    Genera imagen usando Gemini con el prompt compilado.
    
    Request:
    {
        "uploadId": "uuid",
        "prompt": "...",
        "config": {seed, temperature, ...},
        "imageBase64": "..."
    }
    """
    try:
        upload_id = body.get('uploadId')
        prompt = body.get('prompt')
        config = body.get('config', {})
        image_base64 = body.get('imageBase64')
        
        if not prompt or not image_base64:
            return {"success": False, "error": "Missing prompt or image"}
        
        # Generar con Gemini
        print(f"[Generate v41] Generating with Gemini...")
        
        result = await gemini_service.generate_image_v41(
            prompt=prompt,
            image_base64=image_base64,
            config=config
        )
        
        if result.get('success'):
            # Guardar en generations table
            gen_data = {
                'upload_id': upload_id,
                'prompt_used': prompt,
                'config_used': config,
                'watermarked_url': result.get('image_base64'),  # Por ahora guardamos base64
                'is_preview': True,
                'tokens_spent': 0
            }
            
            await supabase_db.client.table('generations').insert(gen_data).execute()
            
            return {
                "success": True,
                "image_base64": result.get('image_base64'),
                "upload_id": upload_id
            }
        else:
            return {"success": False, "error": result.get('error', 'Generation failed')}
        
    except Exception as e:
        print(f"[Generate v41 Endpoint] Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

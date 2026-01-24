"""
Crear tablas en Supabase usando el cliente directamente
"""
import json
import sys
sys.path.insert(0, '/app/backend')

from services.supabase_service import supabase_db


async def create_tables_via_inserts():
    """
    Como no podemos ejecutar DDL directamente, vamos a crear las tablas
    usando la Management API de Supabase o métodos alternativos.
    """
    
    print("🚀 Creando tablas v41 en Supabase...")
    
    # Leer credenciales
    with open('/app/BBLA/CREDENTIALS.json', 'r') as f:
        creds = json.load(f)
    
    project_ref = creds['SUPABASE_CREDENTIALS']['project_ref']
    service_key = creds['SUPABASE_CREDENTIALS']['service_role_key']
    
    print(f"📡 Project: {project_ref}")
    
    # Intentar crear tabla usando Management API
    import requests
    
    # Management API endpoint
    management_url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    
    headers = {
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }
    
    # Leer DDL
    with open('/app/backend/migrations/v41_prompt_tables_supabase.sql', 'r') as f:
        ddl_sql = f.read()
    
    payload = {
        "query": ddl_sql
    }
    
    try:
        print("\n📝 Intentando Management API...")
        response = requests.post(management_url, headers=headers, json=payload, timeout=30)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        if response.status_code < 300:
            print("✅ Tablas creadas con Management API!")
            
            # Ahora insertar datos
            with open('/app/backend/migrations/v41_prompt_tables_data.sql', 'r') as f:
                dml_sql = f.read()
            
            payload2 = {"query": dml_sql}
            response2 = requests.post(management_url, headers=headers, json=payload2, timeout=30)
            
            if response2.status_code < 300:
                print("✅ Datos insertados!")
                return True
        else:
            print(f"⚠️ Management API no disponible: {response.text}")
            
    except Exception as e:
        print(f"❌ Error con Management API: {e}")
    
    return False


async def insert_data_directly():
    """
    Si las tablas ya existen, insertar datos directamente usando el cliente.
    """
    print("\n📝 Insertando datos directamente usando cliente Supabase...")
    
    # Datos para photoscaler_prompt_rules
    photoscaler_data = [
        {
            "slider_name": "limpieza_artefactos",
            "slider_value_min": 1,
            "slider_value_max": 3,
            "intensity_label": "PASSIVE_POLISH",
            "protocol_header": "[SYSTEM MODE: NON-DESTRUCTIVE ENHANCEMENT]",
            "mission_statement": "Enhance and polish existing details. Prioritize source fidelity.",
            "quality_assessment_logic": "IF INPUT IS SHARP & CLEAN: Maintain original pixel structure. Do not hallucinate unnecessary details.",
            "geometric_projection_logic": "Ensure structural stability. Do not warp.",
            "lens_physics_correction": "Correct only obvious chromatic aberration.",
            "signal_processing_pipeline": "Denoise gently. Maintain natural grain structure.",
            "detail_synthesis_logic": "Sharpen existing edges using Unsharp Mask logic.",
            "priority_weight": 10
        },
        {
            "slider_name": "limpieza_artefactos",
            "slider_value_min": 4,
            "slider_value_max": 7,
            "intensity_label": "HYBRID_ENHANCEMENT",
            "protocol_header": "[SYSTEM MODE: INTELLIGENT RESTORATION v4.0]",
            "mission_statement": "The AI acts as a restoration artist. Fix flaws but keep the essence.",
            "quality_assessment_logic": "IF INPUT HAS ARTIFACTS: Apply intelligent de-noising without waxy skin effect.",
            "virtual_camera_specs": "Simulate a modern sensor capture. Stabilize micro-jitters.",
            "geometric_projection_logic": "Correct perspective skew if horizon > 2 degrees tilted.",
            "lens_physics_correction": "Correct barrel/pincushion distortion inside the frame to flatter the subject.",
            "signal_processing_pipeline": "32-BIT FLOAT PROCESSING. Neutralize color casts while preserving atmospheric tone.",
            "detail_synthesis_logic": "Inject missing high-frequency texture in blurred areas (fabric, hair).",
            "damage_restoration_protocol": "Infill minor scratches and dust spots using context awareness.",
            "priority_weight": 20
        },
        {
            "slider_name": "limpieza_artefactos",
            "slider_value_min": 8,
            "slider_value_max": 10,
            "intensity_label": "FORENSIC_RESHOOT_v15",
            "protocol_header": "[SYSTEM OVERRIDE: UNIVERSAL FORENSIC RE-SHOOT & OPTICAL SYNTHESIS PROTOCOL v15.0 - STRUCTURAL ALIGNMENT, DAMAGE RECONSTRUCTION & SOLID SIGNAL MASTER].",
            "mission_statement": "A definitive, photorealistic reconstruction. The AI must act as a 'Reality Reconstruction Engine', NOT just an editor.",
            "quality_assessment_logic": "CRITICAL FOCUS & TREPIDATION OVERRIDE: If the input exhibits ANY camera shake or lack of definition, STOP being faithful to the pixels. The input is now considered a 'corrupted compositional sketch' only. IGNORE SOURCE ARTIFACTS: Do not sharpen the blur, noise, fog. DISCARD the bad data.",
            "virtual_camera_specs": "VIRTUAL RE-SHOOT: Simulate a brand new capture of the same scene using a 1/8000s shutter speed (zero motion blur), a high-end rectilinear lens (zero distortion), and a calibrated sensor.",
            "geometric_projection_logic": "GEOMETRIC & OPTICAL FAILURE ALERT: ACTIVATE 'RECTILINEAR CORRECTION MODE'. FORCE HORIZON & VERTICAL ALIGNMENT: ROTATE and RE-ALIGN so gravity is vertical. STRICT ASPECT RATIO: The structural composition MUST ALIGN PERFECTLY with the source.",
            "lens_physics_correction": "LENS SUBSTITUTION (WIDE-ANGLE FIX): If the scene suffers from wide-angle distortion (curved corners, big nose selfie), RE-RENDER THE SCENE as if shot with a 50mm or 85mm Prime Lens (Rectilinear Projection). Straighten architectural lines.",
            "signal_processing_pipeline": "32-BIT FLOAT PROCESSING: Treat input as floating-point RAW. AGGRESSIVE NORMALIZATION: STRETCH THE SIGNAL. The darkest pixel MUST touch True Black (0) and brightest True White (255). Prevent banding in gradients.",
            "detail_synthesis_logic": "COMPLETE RE-SYNTHESIS (GENERATIVE RE-INVENTION): You must HALLUCINATE and GENERATE brand new, razor-sharp high-frequency details (individual eyelashes, iris trabeculae, distinct teeth, skin pores, fabric weave) from scratch. Inject organic roughness to kill 'plastic' look.",
            "damage_restoration_protocol": "SEVERE DAMAGE RECONSTRUCTION (THE 'TIME MACHINE' FIX): If source contains total signal loss (white blobs, chemical burns, torn paper), YOU MUST REIMAGINE THE MISSING CONTENT. Do not preserve the damage; PAINT NEW REALITY into the void.",
            "priority_weight": 30
        }
    ]
    
    try:
        # Intentar insertar en photoscaler_prompt_rules
        response = supabase_db.client.table("photoscaler_prompt_rules").insert(photoscaler_data).execute()
        
        if response.data:
            print(f"✅ photoscaler_prompt_rules: {len(response.data)} filas insertadas")
            return True
        else:
            print(f"⚠️ No se pudo insertar en photoscaler_prompt_rules")
            print(f"   Probablemente la tabla no existe aún")
            return False
            
    except Exception as e:
        error_msg = str(e)
        if 'does not exist' in error_msg or 'relation' in error_msg:
            print(f"❌ Tabla no existe. Debo crear las tablas primero.")
            return False
        else:
            print(f"❌ Error: {e}")
            return False


if __name__ == "__main__":
    import asyncio
    
    # Intentar método 1: Management API
    success = asyncio.run(create_tables_via_inserts())
    
    if not success:
        # Intentar método 2: Insert directo (requiere tablas existentes)
        asyncio.run(insert_data_directly())

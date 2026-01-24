"""
Limpia tablas incorrectas y actualiza user_presets para Smart Anchors
"""
import json
import requests


def execute_sql(sql: str, project_ref: str, service_key: str, desc: str):
    """Ejecuta SQL en Supabase"""
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    
    headers = {
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }
    
    print(f"\n{desc}...")
    
    try:
        response = requests.post(url, headers=headers, json={"query": sql}, timeout=60)
        
        if response.status_code < 300:
            print(f"✅ OK")
            return True
        else:
            print(f"⚠️ {response.text[:150]}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    # Credenciales
    with open('/app/BBLA/CREDENTIALS.json', 'r') as f:
        creds = json.load(f)
    
    project_ref = creds['SUPABASE_CREDENTIALS']['project_ref']
    service_key = creds['SUPABASE_CREDENTIALS']['service_role_key']
    
    print("=" * 70)
    print("LIMPIEZA + SMART ANCHORS MIGRATION")
    print("=" * 70)
    
    # Limpiar tablas incorrectas
    cleanup_sql = """
-- Eliminar tablas que creé por error
DROP TABLE IF EXISTS photoscaler_prompt_rules CASCADE;
DROP TABLE IF EXISTS lightscaler_prompt_rules CASCADE;
DROP TABLE IF EXISTS stylescaler_prompt_rules CASCADE;
"""
    
    execute_sql(cleanup_sql, project_ref, service_key, "🧹 Limpiando tablas incorrectas")
    
    # Actualizar user_presets_v41 con Smart Anchors
    smart_anchors_sql = """
-- Añadir campos para Smart Anchors
ALTER TABLE user_presets_v41
ADD COLUMN IF NOT EXISTS nano_params JSONB,
ADD COLUMN IF NOT EXISTS anchor_preferences JSONB,
ADD COLUMN IF NOT EXISTS reference_image_url TEXT,
ADD COLUMN IF NOT EXISTS prompt_text TEXT,
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- Comentario de estructura
COMMENT ON COLUMN user_presets_v41.nano_params IS 'Parámetros técnicos: {strength, guidance_scale, sampler, seed}';
COMMENT ON COLUMN user_presets_v41.anchor_preferences IS 'Qué aspectos anclar: {background: bool, lighting: bool, clothes: bool, pose: bool}';
COMMENT ON COLUMN user_presets_v41.reference_image_url IS 'URL de la imagen generada para usar como referencia visual';
COMMENT ON COLUMN user_presets_v41.prompt_text IS 'El prompt cinematográfico compilado (backup)';
"""
    
    execute_sql(smart_anchors_sql, project_ref, service_key, "🔗 Añadiendo Smart Anchors a user_presets_v41")
    
    print("\n" + "=" * 70)
    print("✅ LIMPIEZA Y MIGRACIÓN COMPLETADAS")
    print("=" * 70)


if __name__ == "__main__":
    main()

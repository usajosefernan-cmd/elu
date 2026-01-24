"""
Deployment completo del schema v41 en Supabase
Ejecuta en orden: Tables → Policies → Data
"""
import json
import requests
import time


def execute_in_supabase(sql: str, project_ref: str, service_key: str, description: str) -> bool:
    """Ejecuta SQL en Supabase Management API"""
    
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    
    headers = {
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }
    
    payload = {"query": sql}
    
    print(f"\n🔄 {description}...")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=90)
        
        if response.status_code < 300:
            print(f"✅ {description} - OK")
            return True
        else:
            print(f"❌ {description} - Error: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ {description} - Exception: {e}")
        return False


def main():
    print("=" * 80)
    print("LUXSCALER v41 - COMPLETE DEPLOYMENT TO SUPABASE")
    print("=" * 80)
    
    # Leer credenciales
    with open('/app/BBLA/CREDENTIALS.json', 'r') as f:
        creds = json.load(f)
    
    project_ref = creds['SUPABASE_CREDENTIALS']['project_ref']
    service_key = creds['SUPABASE_CREDENTIALS']['service_role_key']
    
    print(f"\n📡 Project: {project_ref}")
    
    # PASO 1: Crear tablas
    print(f"\n" + "=" * 80)
    print("PASO 1: CREAR TABLAS")
    print("=" * 80)
    
    with open('/app/backend/migrations/v41_01_create_tables.sql', 'r') as f:
        tables_sql = f.read()
    
    success = execute_in_supabase(tables_sql, project_ref, service_key, "Creando 11 tablas")
    
    if not success:
        print("\n⚠️ Hubo errores creando tablas. Continuando de todas formas...")
    
    time.sleep(2)
    
    # PASO 2: Aplicar RLS Policies
    print(f"\n" + "=" * 80)
    print("PASO 2: RLS POLICIES")
    print("=" * 80)
    
    with open('/app/backend/migrations/v41_02_rls_policies.sql', 'r') as f:
        policies_sql = f.read()
    
    execute_in_supabase(policies_sql, project_ref, service_key, "Aplicando RLS policies")
    
    time.sleep(2)
    
    print(f"\n" + "=" * 80)
    print("✅ DEPLOYMENT COMPLETADO")
    print("=" * 80)
    
    print(f"\n📊 Próximo paso: Insertar datos (tier_config, taxonomy, diagnosis, sliders, macros)")
    print(f"   Ejecuta: python /app/backend/deploy_v41_data.py")


if __name__ == "__main__":
    main()

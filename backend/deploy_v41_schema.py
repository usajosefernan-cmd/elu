"""
Ejecutar schema completo v41 en Supabase usando Management API
"""
import json
import requests
import sys

def execute_sql_management_api(sql: str, project_ref: str, service_key: str) -> dict:
    """Ejecuta SQL usando Management API de Supabase"""
    
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    
    headers = {
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }
    
    payload = {"query": sql}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        
        return {
            "success": response.status_code < 300,
            "status_code": response.status_code,
            "response": response.text
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def main():
    print("=" * 70)
    print("LUXSCALER v41 - COMPLETE SCHEMA DEPLOYMENT")
    print("=" * 70)
    
    # Leer credenciales
    with open('/app/BBLA/CREDENTIALS.json', 'r') as f:
        creds = json.load(f)
    
    project_ref = creds['SUPABASE_CREDENTIALS']['project_ref']
    service_key = creds['SUPABASE_CREDENTIALS']['service_role_key']
    
    print(f"\n📡 Project: {project_ref}")
    print(f"🔑 Service Key: {service_key[:30]}...")
    
    # Leer schema completo
    print(f"\n📂 Leyendo schema completo...")
    
    with open('/app/backend/migrations/v41_schema_complete.sql', 'r') as f:
        schema_sql = f.read()
    
    print(f"✅ Schema: {len(schema_sql)} caracteres")
    
    # Ejecutar
    print(f"\n🚀 Ejecutando schema en Supabase...")
    
    result = execute_sql_management_api(schema_sql, project_ref, service_key)
    
    if result['success']:
        print(f"✅ Schema ejecutado exitosamente!")
        print(f"\n📊 Tablas creadas:")
        print(f"   1. tier_config")
        print(f"   2. taxonomy_definitions")
        print(f"   3. diagnosis_definitions")
        print(f"   4. slider_definitions")
        print(f"   5. macro_definitions")
        print(f"   6. profiles")
        print(f"   7. uploads")
        print(f"   8. analysis_results")
        print(f"   9. generations")
        print(f"   10. user_presets_v41")
        print(f"   11. user_upload_workflows")
        return True
    else:
        print(f"❌ Error: {result.get('response', result.get('error'))}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

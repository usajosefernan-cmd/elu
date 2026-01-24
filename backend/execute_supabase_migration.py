"""
LuxScaler v41.0 - Execute migrations in Supabase
"""
import json
import requests


def execute_sql_in_supabase(sql_statement: str, service_role_key: str, project_url: str) -> dict:
    """
    Ejecuta SQL en Supabase usando la API REST.
    """
    # Usar postgrest API
    url = f"{project_url}/rest/v1/rpc/exec_sql"
    
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    payload = {"query": sql_statement}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
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
    print("LUXSCALER v41.0 - SUPABASE MIGRATION EXECUTOR")
    print("=" * 70)
    
    # Leer credenciales
    with open('/app/BBLA/CREDENTIALS.json', 'r') as f:
        creds = json.load(f)
    
    project_url = creds['SUPABASE_CREDENTIALS']['project_url']
    service_role_key = creds['SUPABASE_CREDENTIALS']['service_role_key']
    
    print(f"\n📡 Conectando a: {project_url}")
    print(f"🔑 Usando service_role_key: {service_role_key[:20]}...")
    
    # Leer archivos SQL
    print(f"\n📂 Leyendo archivos SQL...")
    
    with open('/app/backend/migrations/v41_prompt_tables_supabase.sql', 'r') as f:
        ddl_sql = f.read()
    
    with open('/app/backend/migrations/v41_prompt_tables_data.sql', 'r') as f:
        dml_sql = f.read()
    
    print(f"✅ DDL: {len(ddl_sql)} caracteres")
    print(f"✅ DML: {len(dml_sql)} caracteres")
    
    # Intentar ejecutar usando supabase-py
    print(f"\n🚀 Ejecutando migraciones...")
    
    try:
        from supabase import create_client
        
        supabase = create_client(project_url, service_role_key)
        
        # Dividir SQL en statements
        all_sql = ddl_sql + "\n\n" + dml_sql
        
        # Ejecutar usando raw SQL (si está disponible)
        print("\n📝 Intentando ejecutar SQL directamente...")
        
        # Método 1: Intentar con función exec_sql
        result = execute_sql_in_supabase(all_sql, service_role_key, project_url)
        
        if result['success']:
            print("✅ Migración ejecutada exitosamente!")
        else:
            print(f"⚠️ Método API REST no disponible: {result.get('response', result.get('error'))}")
            print("\n📋 SOLUCIÓN ALTERNATIVA:")
            print("Ejecuta manualmente en Supabase SQL Editor:")
            print("1. https://uxqtxkuldjdvpnojgdsh.supabase.co")
            print("2. SQL Editor → New Query")
            print("3. Copia y pega: /app/backend/migrations/v41_prompt_tables_supabase.sql")
            print("4. Run")
            print("5. Copia y pega: /app/backend/migrations/v41_prompt_tables_data.sql")
            print("6. Run")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n📋 Ejecuta manualmente en Supabase SQL Editor (pasos arriba)")


if __name__ == "__main__":
    main()

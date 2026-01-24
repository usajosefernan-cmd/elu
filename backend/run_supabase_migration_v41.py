"""
Ejecutar SQL en Supabase usando conexión PostgreSQL directa
"""
import json
import psycopg2


def main():
    print("=" * 70)
    print("LUXSCALER v41.0 - SUPABASE DIRECT SQL EXECUTOR")
    print("=" * 70)
    
    # Leer credenciales
    with open('/app/BBLA/CREDENTIALS.json', 'r') as f:
        creds = json.load(f)
    
    conn_string = creds['SUPABASE_CREDENTIALS']['db_connection_string']
    
    print(f"\n📡 Conectando a PostgreSQL...")
    print(f"🔑 Connection: {conn_string[:50]}...")
    
    try:
        # Conectar
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True
        cur = conn.cursor()
        
        print(f"✅ Conexión establecida!")
        
        # Leer archivos SQL
        print(f"\n📂 Ejecutando DDL (crear tablas)...")
        
        with open('/app/backend/migrations/v41_prompt_tables_supabase.sql', 'r') as f:
            ddl_sql = f.read()
        
        # Ejecutar DDL
        cur.execute(ddl_sql)
        print(f"✅ Tablas creadas (photoscaler_prompt_rules, lightscaler_prompt_rules, stylescaler_prompt_rules)")
        
        # Ejecutar DML
        print(f"\n📂 Ejecutando DML (insertar datos)...")
        
        with open('/app/backend/migrations/v41_prompt_tables_data.sql', 'r') as f:
            dml_sql = f.read()
        
        cur.execute(dml_sql)
        print(f"✅ Datos insertados")
        
        # Verificar
        print(f"\n🔍 Verificando tablas...")
        
        cur.execute("SELECT COUNT(*) FROM photoscaler_prompt_rules")
        photo_count = cur.fetchone()[0]
        print(f"   photoscaler_prompt_rules: {photo_count} filas")
        
        cur.execute("SELECT COUNT(*) FROM lightscaler_prompt_rules")
        light_count = cur.fetchone()[0]
        print(f"   lightscaler_prompt_rules: {light_count} filas")
        
        cur.execute("SELECT COUNT(*) FROM stylescaler_prompt_rules")
        style_count = cur.fetchone()[0]
        print(f"   stylescaler_prompt_rules: {style_count} filas")
        
        print(f"\n{'='*70}")
        print(f"🎉 ¡MIGRACIÓN v41 COMPLETADA EXITOSAMENTE!")
        print(f"{'='*70}")
        print(f"\n✅ Sistema de prompts modulares activo")
        print(f"✅ {photo_count + light_count + style_count} reglas cargadas en Supabase")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        
        print(f"\n📋 SOLUCIÓN MANUAL:")
        print(f"   Si la conexión falla, ejecuta en Supabase SQL Editor:")
        print(f"   1. https://uxqtxkuldjdvpnojgdsh.supabase.co")
        print(f"   2. SQL Editor → New Query")
        print(f"   3. Pega y ejecuta: /app/backend/migrations/v41_prompt_tables_supabase.sql")
        print(f"   4. Pega y ejecuta: /app/backend/migrations/v41_prompt_tables_data.sql")


if __name__ == "__main__":
    main()

import psycopg2
import os

# Leer el archivo SQL
with open('/app/backend/migrations/user_presets_v40_dictator.sql', 'r') as f:
    sql = f.read()

# Credenciales
conn_string = "postgres://postgres:kk3UNSg6HTG3vLuV@db.uxqtxkuldjdvpnojgdsh.supabase.co:6543/postgres"

try:
    # Conectar a Supabase
    conn = psycopg2.connect(conn_string)
    conn.autocommit = True
    cur = conn.cursor()
    
    # Ejecutar SQL
    print("🚀 Ejecutando migración user_presets_v40_dictator.sql...")
    cur.execute(sql)
    
    print("✅ Migración completada exitosamente!")
    print("✅ Tabla 'user_presets' creada con:")
    print("   - style_lock_prompt (THE DICTATOR PROMPT)")
    print("   - dominant_sliders (locked sliders)")
    print("   - thumbnail_url")
    print("   - RLS policies configuradas")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error ejecutando migración: {e}")
    import traceback
    traceback.print_exc()

from supabase import create_client, Client
import os

# Leer el archivo SQL
with open('/app/backend/migrations/user_presets_v40_dictator.sql', 'r') as f:
    sql = f.read()

# Credenciales de Supabase
SUPABASE_URL = "https://uxqtxkuldjdvpnojgdsh.supabase.co"
# Service role key con más privilegios
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cXR4a3VsZGpkdnBub2pnZHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM0NDcxMiwiZXhwIjoyMDgzOTIwNzEyfQ.oMLuL3u9VWem-fFX95vh4ROljfNG9AWDwq-DFWmxtKg"

try:
    # Crear cliente de Supabase
    supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    
    print("🚀 Ejecutando migración user_presets_v40_dictator.sql...")
    
    # Ejecutar SQL usando el método RPC
    result = supabase.rpc('exec_sql', {'query': sql}).execute()
    
    print("✅ Migración completada exitosamente!")
    print("✅ Tabla 'user_presets' creada con:")
    print("   - style_lock_prompt (THE DICTATOR PROMPT)")
    print("   - dominant_sliders (locked sliders)")
    print("   - thumbnail_url")
    print("   - RLS policies configuradas")
    
except Exception as e:
    print(f"❌ Error ejecutando migración: {e}")
    print("\n⚠️ NOTA: Supabase Python client no puede ejecutar DDL directamente.")
    print("⚠️ Por favor ejecuta el SQL manualmente en Supabase SQL Editor:")
    print(f"⚠️ Dashboard → SQL Editor → Pegar contenido de: /app/backend/migrations/user_presets_v40_dictator.sql")
    import traceback
    traceback.print_exc()

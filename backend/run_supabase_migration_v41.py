"""
Ejecutar SQL en Supabase usando diferentes métodos
"""
import json
import sys
sys.path.insert(0, '/app/backend')

from services.supabase_service import supabase_db


async def execute_migrations():
    """Ejecuta las migraciones usando el cliente de Supabase."""
    
    print("🚀 Ejecutando migraciones v41 en Supabase...")
    
    # Leer credenciales
    with open('/app/BBLA/CREDENTIALS.json', 'r') as f:
        creds = json.load(f)
    
    # Leer SQL files
    with open('/app/backend/migrations/v41_prompt_tables_supabase.sql', 'r') as f:
        ddl_sql = f.read()
    
    with open('/app/backend/migrations/v41_prompt_tables_data.sql', 'r') as f:
        dml_sql = f.read()
    
    try:
        # Método: Ejecutar statements uno por uno usando insert/upsert
        print("\n📋 Creando tablas usando SQL directo...")
        
        # Dividir SQL en statements individuales
        all_statements = (ddl_sql + "\n\n" + dml_sql).split(';')
        
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(all_statements):
            statement = statement.strip()
            if not statement or statement.startswith('--') or len(statement) < 10:
                continue
            
            try:
                # Intentar ejecutar el statement
                print(f"\n[{i+1}] Ejecutando: {statement[:60]}...")
                
                # Usar SQL directo si está disponible
                result = supabase_db.client.rpc('exec', {'sql': statement}).execute()
                
                print(f"✅ Ejecutado")
                success_count += 1
                
            except Exception as e:
                error_msg = str(e)
                if 'does not exist' in error_msg or 'already exists' in error_msg:
                    print(f"⚠️ {error_msg[:100]}")
                else:
                    print(f"❌ Error: {error_msg[:150]}")
                error_count += 1
        
        print(f"\n{'='*70}")
        print(f"✅ Completado: {success_count} statements exitosos, {error_count} errores")
        print(f"{'='*70}")
        
        if error_count > 0:
            print("\n⚠️ Hubo errores. Necesitas ejecutar manualmente en Supabase SQL Editor:")
            print("   1. Ve a: https://uxqtxkuldjdvpnojgdsh.supabase.co")
            print("   2. SQL Editor → New Query")
            print("   3. Ejecuta: /app/backend/migrations/v41_prompt_tables_supabase.sql")
            print("   4. Ejecuta: /app/backend/migrations/v41_prompt_tables_data.sql")
        else:
            print("\n🎉 ¡Migraciones ejecutadas exitosamente!")
            
    except Exception as e:
        print(f"\n❌ Error general: {e}")
        print("\n📋 Por favor ejecuta manualmente en Supabase SQL Editor")


if __name__ == "__main__":
    import asyncio
    asyncio.run(execute_migrations())

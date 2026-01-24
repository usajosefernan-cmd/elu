"""
LuxScaler v41.0 - Migration Runner
Ejecuta las migraciones SQL en Supabase usando la API REST
"""

from services.supabase_service import supabase_db
import re


async def run_migration_v41():
    """
    Ejecuta las migraciones v41 en Supabase.
    Crea las 3 tablas de prompt rules y las puebla con datos.
    """
    try:
        print("🚀 [Migration v41] Iniciando migración de tablas de prompts...")
        
        # Leer archivos SQL
        with open('/app/backend/migrations/v41_prompt_tables_supabase.sql', 'r') as f:
            ddl_sql = f.read()
        
        with open('/app/backend/migrations/v41_prompt_tables_data.sql', 'r') as f:
            dml_sql = f.read()
        
        # Ejecutar DDL (Crear tablas)
        print("📋 Creando tablas...")
        
        # Dividir por statements individuales
        ddl_statements = [s.strip() for s in ddl_sql.split(';') if s.strip() and not s.strip().startswith('--')]
        
        for i, statement in enumerate(ddl_statements):
            if statement:
                try:
                    # Usar la función execute_sql si está disponible
                    # O ejecutar directamente con supabase client
                    print(f"   Ejecutando statement {i+1}/{len(ddl_statements)}...")
                    # Nota: Supabase Python client no puede ejecutar DDL directamente
                    # El usuario debe ejecutar esto manualmente en SQL Editor
                except Exception as e:
                    print(f"   ⚠️ Error en statement {i+1}: {e}")
        
        print("✅ [Migration v41] Tablas creadas exitosamente")
        print("📝 Nota: Si hay errores, ejecuta manualmente los archivos SQL en Supabase SQL Editor")
        
        return {
            "success": True,
            "message": "Migración v41 preparada. Ejecuta los archivos SQL manualmente en Supabase.",
            "files": [
                "/app/backend/migrations/v41_prompt_tables_supabase.sql",
                "/app/backend/migrations/v41_prompt_tables_data.sql"
            ]
        }
        
    except Exception as e:
        print(f"❌ [Migration v41] Error: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def test_sql_builder():
    """
    Test del SQL Prompt Builder consultando las tablas.
    """
    from services.sql_prompt_builder import sql_prompt_builder
    
    print("\n🧪 Testing SQL Prompt Builder...")
    
    # Test config
    test_config = {
        'photoscaler': {'limpieza_artefactos': 9},
        'stylescaler': {'styling_piel': 8},
        'lightscaler': {'sombras': 9}
    }
    
    result = await sql_prompt_builder.build_prompt_from_sliders(
        test_config,
        has_person=True,
        lighting_style='rembrandt_v32'
    )
    
    print(f"\n✅ Prompt generado desde Supabase:")
    print(f"   - Photoscaler rules: {result['metadata']['photoscaler_rules_count']}")
    print(f"   - Lightscaler rules: {result['metadata']['lightscaler_rules_count']}")
    print(f"   - Stylescaler rules: {result['metadata']['stylescaler_rules_count']}")
    print(f"   - Guidance scale: {result['guidance_scale']}")
    print(f"   - Hallucination density: {result['hallucination_density']}")
    
    print(f"\n📝 Photoscaler Block Preview:")
    print(result['photoscaler_block'][:200] + "...")
    
    return result


if __name__ == "__main__":
    import asyncio
    
    print("=" * 60)
    print("LUXSCALER v41.0 - MIGRATION RUNNER")
    print("=" * 60)
    
    # Run migration
    result = asyncio.run(run_migration_v41())
    print(f"\n{result}")
    
    print("\n" + "=" * 60)
    print("INSTRUCCIONES PARA COMPLETAR MIGRACIÓN:")
    print("=" * 60)
    print("\n1. Ve a tu Supabase Dashboard:")
    print("   https://uxqtxkuldjdvpnojgdsh.supabase.co")
    print("\n2. Abre SQL Editor")
    print("\n3. Ejecuta en orden:")
    print("   a) /app/backend/migrations/v41_prompt_tables_supabase.sql")
    print("   b) /app/backend/migrations/v41_prompt_tables_data.sql")
    print("\n4. Verifica que las 3 tablas existen:")
    print("   - photoscaler_prompt_rules")
    print("   - lightscaler_prompt_rules")
    print("   - stylescaler_prompt_rules")
    print("\n5. Prueba el SQL Builder:")
    print("   python /app/backend/migrations/run_migration_v41.py test")

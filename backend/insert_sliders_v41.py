"""
Insertar las 27 definiciones de sliders en Supabase
Cada slider tiene 5 niveles: OFF, LOW, MED, HIGH, FORCE
Total: 27 sliders con sus instrucciones
"""
import sys
sys.path.insert(0, '/app/backend')
from services.supabase_service import supabase_db
import json


# Cargar sliders desde el archivo JSON existente
with open('/app/backend/data/slider_definitions_v40_cinematic.json', 'r') as f:
    v40_data = json.load(f)

# Convertir v40 a v41 format
sliders_v41 = []

for slider in v40_data['sliders']:
    slider_v41 = {
        'slider_key': slider['key_id'],  # limpieza_artefactos, geometria, etc.
        'pillar': slider['pilar'],
        'ui_title': slider['ui_title'],
        'ui_description': slider['ui_description'],
        'instruction_off': slider['levels'].get('OFF', ''),
        'instruction_low': slider['levels'].get('LOW', ''),
        'instruction_med': slider['levels'].get('MED', ''),
        'instruction_high': slider['levels'].get('HIGH', ''),
        'instruction_force': slider['levels'].get('FORCE', ''),
        'auto_default': 5
    }
    
    sliders_v41.append(slider_v41)

print(f"🔄 Insertando {len(sliders_v41)} sliders en Supabase...")

try:
    # Insertar en batches para evitar timeout
    batch_size = 10
    total_inserted = 0
    
    for i in range(0, len(sliders_v41), batch_size):
        batch = sliders_v41[i:i+batch_size]
        response = supabase_db.client.table('slider_definitions').upsert(batch, on_conflict='slider_key').execute()
        total_inserted += len(response.data)
        print(f"   Batch {i//batch_size + 1}: {len(response.data)} sliders")
    
    print(f"\n✅ Total slider_definitions insertados: {total_inserted}")
    
    # Verificar
    result = supabase_db.client.table('slider_definitions').select('*', count='exact').execute()
    print(f"📊 Total en DB: {result.count} sliders")
    
    # Mostrar sample
    print(f"\n📝 Sample de sliders:")
    for slider in result.data[:3]:
        print(f"   - {slider['slider_key']:25s} ({slider['pillar']:15s}) {slider['ui_title']}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

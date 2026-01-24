"""
Inserta TODOS los datos del sistema v41 en Supabase
Basado en 01luxv41sql.md
"""
import sys
sys.path.insert(0, '/app/backend')
from services.supabase_service import supabase_db
import asyncio


async def insert_all_taxonomies():
    """Insertar las 21 categorías completas"""
    
    taxonomies = [
        {'code': 'CAT01', 'category_name': 'SELFIE_CASUAL', 'category_group': 'SERES VIVOS', 'visual_description': 'Selfie con nariz grande, distorsión de gran angular', 'strategy': 'VIRTUAL 50MM LENS. Flatten nasal distortion.', 'slider_config': {"s1": "FORCE", "p2": "FORCE", "l1": "HIGH"}},
        {'code': 'CAT02', 'category_name': 'PRO_HEADSHOT', 'category_group': 'SERES VIVOS', 'visual_description': 'Retrato de estudio para LinkedIn', 'strategy': 'FREQUENCY SEPARATION.', 'slider_config': {"s1": "FORCE", "p3": "FORCE", "l6": "HIGH", "p8": "HIGH"}},
        {'code': 'CAT03', 'category_name': 'GROUP_EVENT', 'category_group': 'SERES VIVOS', 'visual_description': 'Grupo de personas', 'strategy': 'HYPERFOCAL STACK.', 'slider_config': {"p8": "FORCE", "p3": "HIGH", "p2": "MED"}},
        {'code': 'CAT04', 'category_name': 'PET_PORTRAIT', 'category_group': 'SERES VIVOS', 'visual_description': 'Mascota', 'strategy': 'FUR SYNTHESIS.', 'slider_config': {"p6": "FORCE", "p3": "HIGH", "l1": "HIGH"}},
        {'code': 'CAT05', 'category_name': 'FASHION_LOOKBOOK', 'category_group': 'SERES VIVOS', 'visual_description': 'Modelaje de ropa', 'strategy': 'FABRIC PHYSICS.', 'slider_config': {"s3": "FORCE", "p3": "HIGH"}},
        {'code': 'CAT06', 'category_name': 'MACRO_NATURE', 'category_group': 'SERES VIVOS', 'visual_description': 'Plantas, flores', 'strategy': 'FOCUS STACKING.', 'slider_config': {"p3": "FORCE", "p8": "FORCE"}},
        {'code': 'CAT07', 'category_name': 'INTERIOR_LIVING', 'category_group': 'RÍGIDOS', 'visual_description': 'Interior de casa', 'strategy': 'VERTICAL LOCK.', 'slider_config': {"p2": "FORCE", "p5": "HIGH"}},
        {'code': 'CAT08', 'category_name': 'KITCHEN_BATH', 'category_group': 'RÍGIDOS', 'visual_description': 'Cocina o baño', 'strategy': 'PREMIUM GLOSS.', 'slider_config': {"p1": "MED", "s9": "FORCE"}},
        {'code': 'CAT09', 'category_name': 'EXTERIOR_FACADE', 'category_group': 'RÍGIDOS', 'visual_description': 'Fachada de edificio', 'strategy': '2-POINT PERSPECTIVE.', 'slider_config': {"p2": "FORCE", "l4": "FORCE"}},
        {'code': 'CAT10', 'category_name': 'CAR_SALE_STD', 'category_group': 'RÍGIDOS', 'visual_description': 'Foto de coche', 'strategy': 'CERAMIC COATING.', 'slider_config': {"p1": "MED", "s9": "FORCE"}},
        {'code': 'CAT11', 'category_name': 'MOTORCYCLE_DETAIL', 'category_group': 'RÍGIDOS', 'visual_description': 'Motocicleta', 'strategy': 'CHROME POLISH.', 'slider_config': {"s9": "FORCE", "p3": "HIGH"}},
        {'code': 'CAT12', 'category_name': 'PRODUCT_STUDIO', 'category_group': 'PRODUCTOS', 'visual_description': 'Producto en fondo blanco', 'strategy': 'WHITE BACKGROUND LOCK.', 'slider_config': {"p3": "FORCE", "l6": "FORCE"}},
        {'code': 'CAT13', 'category_name': 'JEWELRY_MACRO', 'category_group': 'PRODUCTOS', 'visual_description': 'Joyas, gemas', 'strategy': 'FOCUS STACKING.', 'slider_config': {"p3": "FORCE", "p8": "FORCE", "s9": "FORCE"}},
        {'code': 'CAT14', 'category_name': 'FOOD_MENU', 'category_group': 'PRODUCTOS', 'visual_description': 'Comida', 'strategy': 'SUCCULENCE ENHANCEMENT.', 'slider_config': {"p3": "HIGH", "s9": "FORCE"}},
        {'code': 'CAT15', 'category_name': 'SCANNED_OFFICIAL', 'category_group': 'DOCUMENTAL', 'visual_description': 'Documento escaneado', 'strategy': 'FLATTEN DOC + OCR.', 'slider_config': {"p2": "FORCE", "l6": "FORCE"}},
        {'code': 'CAT16', 'category_name': 'OLD_MANUSCRIPT', 'category_group': 'DOCUMENTAL', 'visual_description': 'Manuscrito antiguo', 'strategy': 'PAPER PRESERVATION.', 'slider_config': {"p1": "FORCE", "l6": "MED"}},
        {'code': 'CAT17', 'category_name': 'DAMAGED_PHOTO', 'category_group': 'DOCUMENTAL', 'visual_description': 'Fotografía rota', 'strategy': 'PHYSICAL REPAIR.', 'slider_config': {"p1": "FORCE", "p3": "FORCE"}},
        {'code': 'CAT18', 'category_name': 'COLORIZE_VINTAGE', 'category_group': 'DOCUMENTAL', 'visual_description': 'Foto B&W', 'strategy': 'HISTORICAL COLOR.', 'slider_config': {"p7": "MED", "s8": "FORCE"}},
        {'code': 'CAT19', 'category_name': 'SKETCH_DRAWING', 'category_group': 'DOCUMENTAL', 'visual_description': 'Dibujo a lápiz', 'strategy': 'GRAPHITE PRESERVATION.', 'slider_config': {"p1": "FORCE", "p6": "FORCE"}},
        {'code': 'CAT20', 'category_name': 'DIGITAL_ILLUSTRATION', 'category_group': 'DOCUMENTAL', 'visual_description': 'Ilustración digital', 'strategy': 'VECTOR DENOISE.', 'slider_config': {"p1": "FORCE", "p3": "LOW"}},
        {'code': 'CAT21', 'category_name': 'ERROR_UNIDENTIFIED', 'category_group': 'FALLBACK', 'visual_description': 'Imagen ilegible', 'strategy': 'REIMAGINE MODE.', 'slider_config': {"p6": "FORCE", "p5": "HIGH"}},
    ]
    
    try:
        response = supabase_db.client.table('taxonomy_definitions').upsert(taxonomies).execute()
        print(f"✅ taxonomy_definitions: {len(response.data)} filas")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def insert_diagnosis():
    """Insertar 10 diagnósticos"""
    print("\n📊 Insertando diagnosis_definitions...")
    
    diagnosis = [
        {'code': 'IN02', 'diagnosis_name': 'MOBILE_PROCESSED', 'visual_description': 'Smartphone photo with waxy skin', 'strategy': 'ORGANIC TEXTURE INJECTION.', 'slider_config': {"p6": "HIGH", "s1": "HIGH", "p3": "HIGH"}},
        {'code': 'IN03', 'diagnosis_name': 'SOFT_FOCUS', 'visual_description': 'Focal plane missed subject', 'strategy': 'DEFINITION RE-SYNTHESIS.', 'slider_config': {"p3": "FORCE", "p6": "HIGH", "l1": "FORCE"}},
        {'code': 'IN04', 'diagnosis_name': 'MOTION_BLUR', 'visual_description': 'Camera shake or movement', 'strategy': 'STATIC RECONSTRUCTION.', 'slider_config': {"p4": "FORCE", "p3": "HIGH"}},
        {'code': 'IN05', 'diagnosis_name': 'ISO_NOISE', 'visual_description': 'Low-light noise', 'strategy': 'SIGNAL PURIFICATION.', 'slider_config': {"p1": "FORCE", "p3": "HIGH"}},
        {'code': 'IN06', 'diagnosis_name': 'COMPRESSION_ARTIFACTS', 'visual_description': 'Heavy compression', 'strategy': 'ARTIFACT HALLUCINATION.', 'slider_config': {"p1": "FORCE", "p3": "HIGH"}},
        {'code': 'IN07', 'diagnosis_name': 'PIXELATED_LOW_RES', 'visual_description': 'Extremely low-resolution', 'strategy': 'SEMANTIC UPSCALING.', 'slider_config': {"p6": "FORCE", "p9": "FORCE"}},
        {'code': 'IN08', 'diagnosis_name': 'VINTAGE_FADED', 'visual_description': 'Chemical decay', 'strategy': 'CHEMICAL RESTORATION.', 'slider_config': {"l7": "FORCE", "l6": "HIGH"}},
        {'code': 'IN09', 'diagnosis_name': 'PHYSICAL_DAMAGE', 'visual_description': 'Tears, scratches', 'strategy': 'STRUCTURAL INPAINTING.', 'slider_config': {"p1": "FORCE", "p6": "HIGH"}},
        {'code': 'IN10', 'diagnosis_name': 'STRUCTURAL_LOSS', 'visual_description': 'Severe damage', 'strategy': 'ANATOMICAL RECONSTRUCTION.', 'slider_config': {"p6": "FORCE", "p3": "FORCE"}},
        {'code': 'IN11', 'diagnosis_name': 'CRITICAL_FAILURE', 'visual_description': 'Technically unusable', 'strategy': 'TOTAL RE-CREATION.', 'slider_config': {"p5": "FORCE", "p6": "FORCE", "l1": "FORCE"}},
    ]
    
    try:
        response = supabase_db.client.table('diagnosis_definitions').upsert(diagnosis).execute()
        print(f"✅ diagnosis_definitions: {len(response.data)} filas")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def insert_macros():
    """Insertar 12 macros (3 USER + 9 PRO)"""
    print("\n📊 Insertando macro_definitions...")
    
    macros = [
        # USER (3 macros)
        {'macro_key': 'calidad_imagen', 'profile_tier': 'USER', 'pillar': None, 'ui_title': 'Calidad Imagen', 'ui_icon': '💎', 'slave_sliders': ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']},
        {'macro_key': 'estetica_ia', 'profile_tier': 'USER', 'pillar': None, 'ui_title': 'Estética IA', 'ui_icon': '✨', 'slave_sliders': ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9']},
        {'macro_key': 'iluminacion_pro', 'profile_tier': 'USER', 'pillar': None, 'ui_title': 'Iluminación Pro', 'ui_icon': '💡', 'slave_sliders': ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9']},
        # PRO (9 macros)
        {'macro_key': 'restauracion', 'profile_tier': 'PRO', 'pillar': 'PHOTOSCALER', 'ui_title': 'Restauración', 'ui_icon': '🛠️', 'slave_sliders': ['p1', 'p2', 'p8', 'p9']},
        {'macro_key': 'fidelidad', 'profile_tier': 'PRO', 'pillar': 'PHOTOSCALER', 'ui_title': 'Fidelidad', 'ui_icon': '🔍', 'slave_sliders': ['p3', 'p4', 'p6']},
        {'macro_key': 'caracter', 'profile_tier': 'PRO', 'pillar': 'PHOTOSCALER', 'ui_title': 'Carácter', 'ui_icon': '🎞️', 'slave_sliders': ['p5', 'p7']},
        {'macro_key': 'presencia', 'profile_tier': 'PRO', 'pillar': 'STYLESCALER', 'ui_title': 'Presencia', 'ui_icon': '👤', 'slave_sliders': ['s1', 's2', 's3']},
        {'macro_key': 'pulido', 'profile_tier': 'PRO', 'pillar': 'STYLESCALER', 'ui_title': 'Pulido', 'ui_icon': '🧼', 'slave_sliders': ['s4', 's5', 's6']},
        {'macro_key': 'cinematica', 'profile_tier': 'PRO', 'pillar': 'STYLESCALER', 'ui_title': 'Cinemática', 'ui_icon': '🎬', 'slave_sliders': ['s7', 's8', 's9']},
        {'macro_key': 'volumen', 'profile_tier': 'PRO', 'pillar': 'LIGHTSCALER', 'ui_title': 'Volumen', 'ui_icon': '📐', 'slave_sliders': ['l1', 'l2', 'l3']},
        {'macro_key': 'drama', 'profile_tier': 'PRO', 'pillar': 'LIGHTSCALER', 'ui_title': 'Drama', 'ui_icon': '🎭', 'slave_sliders': ['l4', 'l5', 'l6']},
        {'macro_key': 'atmosfera_macro', 'profile_tier': 'PRO', 'pillar': 'LIGHTSCALER', 'ui_title': 'Atmósfera', 'ui_icon': '🌫️', 'slave_sliders': ['l7', 'l8', 'l9']},
    ]
    
    try:
        response = supabase_db.client.table('macro_definitions').upsert(macros).execute()
        print(f"✅ macro_definitions: {len(response.data)} macros")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def main():
    print("🚀 Insertando TODOS los datos en Supabase...\n")
    
    await insert_all_taxonomies()
    await insert_diagnosis()
    await insert_macros()
    
    print("\n✅ Datos insertados correctamente")
    print("📊 Verificando...")
    
    # Verificar
    try:
        tier_count = supabase_db.client.table('tier_config').select('*', count='exact').execute()
        tax_count = supabase_db.client.table('taxonomy_definitions').select('*', count='exact').execute()
        diag_count = supabase_db.client.table('diagnosis_definitions').select('*', count='exact').execute()
        macro_count = supabase_db.client.table('macro_definitions').select('*', count='exact').execute()
        
        print(f"\n✅ tier_config: {tier_count.count} filas")
        print(f"✅ taxonomy_definitions: {tax_count.count} filas")
        print(f"✅ diagnosis_definitions: {diag_count.count} filas")
        print(f"✅ macro_definitions: {macro_count.count} filas")
    except:
        pass


if __name__ == "__main__":
    asyncio.run(main())

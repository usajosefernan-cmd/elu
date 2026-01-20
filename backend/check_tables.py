from check_supabase import supabase_service

try:
    response = supabase_service.client.table("slider_semantic_mappings").select("*").limit(1).execute()
    print("Table 'slider_semantic_mappings' EXISTS.")
except Exception as e:
    print(f"Table check failed (likely does not exist): {e}")

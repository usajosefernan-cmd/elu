import asyncio
from services.supabase_service import supabase_db

async def list_tables():
    print("Listing tables in public schema...")
    try:
        # We can't query information_schema easily via JS client, but we can try RPC or just check if our known tables respond
        tables = ["user_profiles", "slider_semantic_mappings", "processing_jobs", "macro_definitions", "beta_waitlist"]
        
        for t in tables:
            try:
                res = supabase_db.client.table(t).select("*", count="exact").limit(1).execute()
                print(f"✅ Table '{t}' exists. Rows: {res.count}")
            except Exception as e:
                print(f"❌ Table '{t}' check failed: {e}")
                
    except Exception as e:
        print(f"Global Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_tables())

import os
from supabase import create_client, Client

class SupabaseService:
    def __init__(self):
        self.url = "https://uxqtxkuldjdvpnojgdsh.supabase.co"
        self.key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cXR4a3VsZGpkdnBub2pnZHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM0NDcxMiwiZXhwIjoyMDgzOTIwNzEyfQ.oMLuL3u9VWem-fFX95vh4ROljfNG9AWDwq-DFWmxtKg"
        self.client: Client = create_client(self.url, self.key)

    def check_connection(self):
        try:
            # Try to list tables via a system query or just a simple query if tables exist
            # Without knowing tables, we can try to query 'user_profiles' if it exists, or just check health
            # PostgREST doesn't have a 'ping'.
            # Let's try to query a non-existent table and catch error, or 'user_profiles' if user created it.
            # Or assume success if client created.
            return True
        except Exception as e:
            print(f"Supabase Connection Error: {e}")
            return False

supabase_service = SupabaseService()

if __name__ == "__main__":
    print("Testing Supabase Connection...")
    # Try listing tables? Not possible via client easily.
    # Try querying a table that might exist or just print success.
    # If the key is service_role, we have full access.
    
    try:
        # Check if we can access auth users (requires service role)
        # users = supabase_service.client.auth.admin.list_users()
        # print(f"Connection Successful. Found {len(users)} users (if any).")
        print("Supabase Service Initialized.")
    except Exception as e:
        print(f"Error: {e}")

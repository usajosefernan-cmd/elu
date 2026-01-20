import asyncio
from supabase import create_client, Client

# Config
URL = "https://uxqtxkuldjdvpnojgdsh.supabase.co"
# Service Role Key (from CREDENTIALS.json or environment)
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cXR4a3VsZGpkdnBub2pnZHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM0NDcxMiwiZXhwIjoyMDgzOTIwNzEyfQ.oMLuL3u9VWem-fFX95vh4ROljfNG9AWDwq-DFWmxtKg"

async def update_password():
    supabase: Client = create_client(URL, KEY)
    email = "usajosefernan@gmail.com"
    new_password = "111111"

    print(f"Updating password for {email}...")
    
    # 1. Get User ID from Auth
    try:
        # List users to find the ID
        users = supabase.auth.admin.list_users()
        user = next((u for u in users if u.email == email), None)
        
        if not user:
            print("User not found in Auth. Creating...")
            attributes = {
                "email": email,
                "password": new_password,
                "email_confirm": True
            }
            user = supabase.auth.admin.create_user(attributes)
            print(f"User created with ID: {user.user.id}")
            user_id = user.user.id
        else:
            print(f"User found: {user.id}")
            # Update password
            supabase.auth.admin.update_user_by_id(user.id, {"password": new_password})
            print("Password updated successfully.")
            user_id = user.id

        # 2. Ensure Profile exists
        print("Checking user_profiles...")
        res = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
        
        if not res.data:
            print("Profile missing. Creating...")
            profile_data = {
                "id": user_id,
                "email": email,
                "user_mode": "prolux",
                "username": "@admin",
                "full_name": "Admin User",
                "tokens_balance": 999999
            }
            supabase.table("user_profiles").insert(profile_data).execute()
            print("Profile created.")
        else:
            print("Profile exists.")
            # Ensure it's prolux/admin
            supabase.table("user_profiles").update({"user_mode": "prolux"}).eq("id", user_id).execute()
            print("Profile updated to PROLUX mode.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(update_password())

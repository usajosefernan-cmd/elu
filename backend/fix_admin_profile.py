import asyncio
from services.supabase_service import supabase_db

async def create_admin():
    email = "usajosefernan@gmail.com"
    # Check if exists
    user = await supabase_db.get_user_profile(email)
    if user:
        print(f"User {email} already exists: {user}")
        return

    # Create
    print(f"Creating user {email}...")
    # We need the Auth ID. 
    # Since we can't query auth.users via client easily (service key can, but client methods differ),
    # we will try to insert. 
    # Wait, the table definition has 'id' default gen_random_uuid().
    # Ideally 'id' should match auth.users.id.
    # If we insert a random UUID, it won't link to the Auth user.
    # We need to fetch the Auth User ID first.
    
    # Using the Admin API to get user by email
    try:
        # Supabase Python SDK Admin
        res = supabase_db.client.auth.admin.list_users()
        # Find user
        auth_user = next((u for u in res if u.email == email), None)
        if not auth_user:
            print("Auth user not found! Creating auth user...")
            # Create auth user if missing
            res = supabase_db.client.auth.admin.create_user({
                "email": email,
                "password": "password123", # temp
                "email_confirm": True
            })
            auth_user = res.user
        
        # Now insert profile with correct ID
        data = {
            "id": auth_user.id,
            "email": email,
            "user_mode": "prolux" # Admin gets full access
        }
        res = supabase_db.client.table("user_profiles").insert(data).execute()
        print("Profile created:", res.data)
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_admin())

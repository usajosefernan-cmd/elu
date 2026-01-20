from services.supabase_service import supabase_db

def create_or_update_admin():
    email = "usajosefernan@gmail.com"
    password = "111111" # Requested password
    
    print(f"Provisioning User: {email}")
    
    user_id = None
    
    # 1. Check if exists
    try:
        users = supabase_db.client.auth.admin.list_users()
        for u in users:
            if u.email == email:
                user_id = u.id
                print(f"User exists ({user_id}). Updating password...")
                supabase_db.client.auth.admin.update_user_by_id(user_id, { "password": password })
                print("Password updated to 111111")
                break
    except Exception as e:
        print(f"List users failed: {e}")

    # 2. Create if not found
    if not user_id:
        try:
            print("Creating new user...")
            user = supabase_db.client.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": { "full_name": "Jose Admin" }
            })
            user_id = user.user.id
            print(f"User Created: {user_id}")
        except Exception as e:
            print(f"Create Failed: {e}")

    # 3. Try to Grant Admin in 'profiles' (if table exists)
    if user_id:
        try:
            profile_data = {
                "id": user_id,
                "email": email,
                "role": "admin",
                "is_beta_user": True,
                "username": "@usajose"
            }
            supabase_db.client.table("profiles").upsert(profile_data).execute()
            print("Profile updated.")
        except Exception as e:
            print(f"Profile update skipped (Table missing?): {e}")

if __name__ == "__main__":
    create_or_update_admin()

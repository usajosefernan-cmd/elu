from services.supabase_service import supabase_db

def create_admin():
    email = "usajosefernan@gmail.com"
    password = "LuxScaler2026!"
    
    print(f"Creating Admin User: {email}")
    
    # 1. Create in Supabase Auth
    try:
        user = supabase_db.client.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": { "full_name": "Admin Operator" }
        })
        print(f"Auth User Created: {user.user.id}")
        user_id = user.user.id
    except Exception as e:
        print(f"Auth Create Failed (might exist): {e}")
        # Try to get ID if exists?
        # Listing users is possible with service key
        users = supabase_db.client.auth.admin.list_users()
        for u in users:
            if u.email == email:
                user_id = u.id
                print(f"Found existing user: {user_id}")
                break
        else:
            print("Could not find user ID.")
            return

    # 2. Insert into 'profiles' (Repo expectation) or 'user_profiles' (My schema)
    # Let's try both to be safe and cover all bases
    profile_data = {
        "id": user_id,
        "email": email,
        "full_name": "Admin Operator",
        "username": "@admin",
        "is_beta_user": True,
        # 'role': 'admin' # If column exists
    }
    
    tables = ["profiles", "user_profiles"]
    
    for table in tables:
        try:
            print(f"Upserting into {table}...")
            # Upsert
            supabase_db.client.table(table).upsert(profile_data).execute()
            print(f"Success {table}")
        except Exception as e:
            print(f"Failed {table}: {e}")

if __name__ == "__main__":
    create_admin()

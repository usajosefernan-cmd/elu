import psycopg2
import os

DB_URL = "postgres://postgres:kk3UNSg6HTG3vLuV@db.uxqtxkuldjdvpnojgdsh.supabase.co:6543/postgres"

def run_migration():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Read SQL file
        with open('/app/backend/v28_schema.sql', 'r') as f:
            sql = f.read()
            
        print("Executing Migration...")
        cur.execute(sql)
        conn.commit()
        print("Migration Success!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration Failed: {e}")

if __name__ == "__main__":
    run_migration()

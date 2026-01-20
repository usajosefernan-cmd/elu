import requests
import json

PAT = "sbp_d251dde2332b9f066e71df92c983344648624411"
PROJECT_REF = "uxqtxkuldjdvpnojgdsh"

def run_sql_api(sql):
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/query"
    headers = {
        "Authorization": f"Bearer {PAT}",
        "Content-Type": "application/json"
    }
    data = {"query": sql}
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        print("SQL Execution Success!")
        return response.json()
    elif response.status_code == 404:
        # Endpoint might not exist or be different
        print("SQL API Endpoint 404. Trying pg-meta...")
        # pg-meta is typically internal.
        return None
    else:
        print(f"SQL Execution Failed: {response.status_code} {response.text}")
        return None

if __name__ == "__main__":
    # Test query
    res = run_sql_api("SELECT version();")
    if not res:
        print("Could not run SQL via Management API.")

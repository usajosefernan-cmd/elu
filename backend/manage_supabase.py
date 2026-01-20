import requests
import os

PAT = "sbp_d251dde2332b9f066e71df92c983344648624411"
PROJECT_REF = "uxqtxkuldjdvpnojgdsh"

def list_functions():
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/functions"
    headers = {"Authorization": f"Bearer {PAT}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        funcs = resp.json()
        print("Edge Functions found:")
        for f in funcs:
            print(f"- {f.get('name')} (Status: {f.get('status')})")
    else:
        print(f"Error listing functions: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    list_functions()

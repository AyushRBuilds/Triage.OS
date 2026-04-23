import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("frontend/.env")

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

# Get all patients
response = supabase.table("patients").select("id, assigned_nurse_id").execute()
patients = response.data

for p in patients:
    if p.get("assigned_nurse_id"):
        # Insert into patient_assignments
        try:
            supabase.table("patient_assignments").insert({
                "patient_id": p["id"],
                "nurse_id": p["assigned_nurse_id"],
                "is_temporary": False
            }).execute()
            print(f"Assigned {p['id']} to {p['assigned_nurse_id']}")
        except Exception as e:
            print(f"Already assigned or error for {p['id']}: {e}")

print("Done seeding assignments.")

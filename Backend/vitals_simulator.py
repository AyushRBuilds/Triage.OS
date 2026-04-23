import os
import time
import random
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from the same directory as this script
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, ".env"))

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY must be in .env")
    exit(1)

supabase: Client = create_client(url, key)

def get_base_vitals(risk):
    """Returns base vitals and fluctuation ranges based on patient risk."""
    if risk == 'P1': # Critical
        return {
            "hr": (110, 130), "spo2": (88, 92), "temp": (38.5, 40.0), 
            "bp_sys": (150, 180), "bp_dia": (90, 110), "rr": (24, 32)
        }
    elif risk == 'P2': # High Risk
        return {
            "hr": (90, 110), "spo2": (91, 95), "temp": (37.5, 38.5), 
            "bp_sys": (130, 150), "bp_dia": (85, 95), "rr": (20, 26)
        }
    elif risk == 'P3': # Moderate
        return {
            "hr": (75, 95), "spo2": (95, 98), "temp": (37.0, 37.8), 
            "bp_sys": (120, 135), "bp_dia": (75, 85), "rr": (16, 20)
        }
    else: # Stable (P4, P5)
        return {
            "hr": (65, 80), "spo2": (97, 100), "temp": (36.5, 37.2), 
            "bp_sys": (110, 125), "bp_dia": (70, 80), "rr": (12, 16)
        }

def simulate():
    print("Starting Triage.OS Vitals Simulator...")
    while True:
        try:
            # 1. Fetch all patients
            response = supabase.table("patients").select("id, risk, name").execute()
            patients = response.data

            # 2. Update vitals for each patient
            for p in patients:
                base = get_base_vitals(p['risk'])
                
                # Add small random fluctuation to "simulated" values
                vital_update = {
                    "patient_id": p['id'],
                    "heart_rate": random.randint(*base['hr']),
                    "spo2": random.randint(*base['spo2']),
                    "temperature": round(random.uniform(*base['temp']), 1),
                    "bp_sys": random.randint(*base['bp_sys']),
                    "bp_dia": random.randint(*base['bp_dia']),
                    "rr": random.randint(*base['rr']),
                    "recorded_at": "now()"
                }

                supabase.table("vitals").upsert(vital_update, on_conflict="patient_id").execute()
            
            print(f"Simulated vitals for {len(patients)} patients.")
            time.sleep(5) # Update every 5 seconds per user request

        except Exception as e:
            print(f"Simulation Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    simulate()

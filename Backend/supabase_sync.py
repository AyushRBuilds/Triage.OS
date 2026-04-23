import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client = None

def get_supabase():
    global _client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        return None
        
    if _client is None:
        _client = create_client(url, key)
    return _client

def sync_vitals_to_supabase(patient_id, vitals_data):
    """
    Sync vitals and calculated risk score back to Supabase.
    """
    client = get_supabase()
    if not client:
        return
        
    # Mapping our internal names to Supabase column names
    # internal: heart_rate, blood_pressure_sys, blood_pressure_dia, spo2, temperature, risk_score
    # supabase: hr, bp_sys, bp_dia, spo2, temp, risk (Note: check these in services.js normalizePatient)
    
    payload = {
        "patient_id": patient_id,
<<<<<<< HEAD
        "hr": vitals_data.get("heart_rate"),
        "bp_sys": vitals_data.get("blood_pressure_sys"),
        "bp_dia": vitals_data.get("blood_pressure_dia"),
        "spo2": vitals_data.get("spo2"),
        "temp": vitals_data.get("temperature"),
        "risk_score": vitals_data.get("risk_score"),
=======
        "heart_rate": vitals_data.get("heart_rate"),
        "bp_sys": vitals_data.get("blood_pressure_sys"),
        "bp_dia": vitals_data.get("blood_pressure_dia"),
        "spo2": vitals_data.get("spo2"),
        "temperature": vitals_data.get("temperature"),
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
        "recorded_at": "now()",
    }
    
    try:
        client.table("vitals").upsert(payload, on_conflict="patient_id").execute()
        
        # Also update the patient's main risk field if applicable
        # This will depend on the risk_score threshold
        score = vitals_data.get("risk_score")
        if score is not None:
            risk_label = "P3"
            if score > 0.8: risk_label = "P1"
            elif score > 0.5: risk_label = "P2"
            
            client.table("patients").update({"risk": risk_label}).eq("id", patient_id).execute()
    except Exception as e:
        print(f"[Supabase Sync Error] {e}")

def sync_soap_to_supabase(patient_id, soap_data):
    """
    Sync SOAP notes and AI-derived urgency back to Supabase.
    """
    client = get_supabase()
    if not client:
        return
        
    payload = {
        "patient_id": patient_id,
        "subjective": soap_data.get("subjective"),
        "objective": soap_data.get("objective"),
        "assessment": soap_data.get("assessment"),
        "plan": soap_data.get("plan"),
        "raw_text": soap_data.get("raw_text"),
        "entities": soap_data.get("entities"),
        "urgency_level": soap_data.get("urgency_level"),
        "recorded_at": "now()",
    }
    
    try:
        client.table("soap_notes").insert(payload).execute()
    except Exception as e:
        print(f"[Supabase SOAP Sync Error] {e}")


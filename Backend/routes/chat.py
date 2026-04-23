from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import os
import re
from datetime import datetime

router = APIRouter()


class ChatMessage(BaseModel):
    patient_id: Optional[int] = None
    message: str


class ChatResponse(BaseModel):
    reply: str
    source_docs: list[str] = []


from ai.rag.chatbot import answer
from database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from models import Patient, SOAPNote, Vital


def _get_supabase_client():
    try:
        from supabase import create_client
    except Exception:
        return None

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        return None

    try:
        return create_client(url, key)
    except Exception:
        return None


def _normalise_datetime(value):
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _extract_name_and_bed(message: str):
    lower = message.lower()
    bed_match = re.search(r"\bbed\s*([0-9]+|[a-z]+)\b", lower)
    bed = f"Bed {bed_match.group(1).title()}" if bed_match else None

    cleaned = re.sub(
        r"\b(tell me about|what about|about|patient|mr\.?|mrs\.?|ms\.?|miss\.?|dr\.?)\b",
        "",
        message,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"\bbed\s*[0-9a-z]+\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"[^a-zA-Z\s]", " ", cleaned).strip()
    words = [w for w in cleaned.split() if len(w) > 2]
    name = " ".join(words[:3]) if words else None
    return name, bed


def _load_patient_context_from_supabase(message: str, patient_id: Optional[int]):
    client = _get_supabase_client()
    if not client:
        return None

    patient_row = None
    resolved_id = patient_id
    resolved_name, resolved_bed = _extract_name_and_bed(message)

    try:
        if resolved_id is not None:
            rows = client.table("patients").select("*").eq("id", resolved_id).limit(1).execute().data
            patient_row = (rows or [None])[0]

        if patient_row is None and resolved_bed:
            rows = client.table("patients").select("*").ilike("bed", resolved_bed).limit(1).execute().data
            patient_row = (rows or [None])[0]

        if patient_row is None and resolved_name:
            rows = client.table("patients").select("*").ilike("name", f"%{resolved_name}%").limit(1).execute().data
            patient_row = (rows or [None])[0]
    except Exception:
        patient_row = None

    if not patient_row:
        return None

    resolved_id = patient_row.get("id")

    def _latest(table_name: str, order_column: str):
        try:
            rows = (
                client.table(table_name)
                .select("*")
                .eq("patient_id", resolved_id)
                .order(order_column, desc=True)
                .limit(1)
                .execute()
                .data
            )
            return (rows or [None])[0]
        except Exception:
            return None

    latest_vital = _latest("vitals", "recorded_at")
    latest_soap = _latest("soap_notes", "recorded_at")

    medications = []
    try:
        medications = (
            client.table("medications")
            .select("name,schedule,time,urgency,status")
            .eq("patient_id", resolved_id)
            .execute()
            .data
            or []
        )
    except Exception:
        medications = []

    assignments = []
    try:
        assignments = (
            client.table("patient_assignments")
            .select("is_temporary,assigned_at,nurse:nurses(id,name,initials)")
            .eq("patient_id", resolved_id)
            .execute()
            .data
            or []
        )
    except Exception:
        assignments = []

    return {
        "patient_profile": {
            "id": patient_row.get("id"),
            "name": patient_row.get("name"),
            "bed": patient_row.get("bed"),
            "ward": patient_row.get("ward"),
            "age": patient_row.get("age"),
            "gender": patient_row.get("gender"),
            "risk": patient_row.get("risk"),
            "chief_complaint": patient_row.get("chief_complaint"),
            "diagnosis": patient_row.get("diagnosis"),
            "admitted_date": _normalise_datetime(patient_row.get("admitted_date")),
        },
        "vitals": {
            "heart_rate": latest_vital.get("heart_rate") if latest_vital else None,
            "blood_pressure_sys": latest_vital.get("bp_sys") if latest_vital else None,
            "blood_pressure_dia": latest_vital.get("bp_dia") if latest_vital else None,
            "spo2": latest_vital.get("spo2") if latest_vital else None,
            "temperature": latest_vital.get("temperature") if latest_vital else None,
            "risk_score": latest_vital.get("risk_score") if latest_vital else None,
            "recorded_at": _normalise_datetime(latest_vital.get("recorded_at")) if latest_vital else None,
        },
        "soap_note": {
            "subjective": latest_soap.get("subjective") if latest_soap else None,
            "objective": latest_soap.get("objective") if latest_soap else None,
            "assessment": latest_soap.get("assessment") if latest_soap else None,
            "plan": latest_soap.get("plan") if latest_soap else None,
            "raw_text": latest_soap.get("raw_text") if latest_soap else None,
            "entities": latest_soap.get("entities") if latest_soap else [],
            "urgency_level": latest_soap.get("urgency_level") if latest_soap else None,
            "urgency_confidence": latest_soap.get("urgency_confidence") if latest_soap else None,
            "recorded_at": _normalise_datetime(latest_soap.get("recorded_at")) if latest_soap else None,
        },
        "medications": medications,
        "assignments": [
            {
                "is_temporary": item.get("is_temporary"),
                "assigned_at": _normalise_datetime(item.get("assigned_at")),
                "nurse_name": (item.get("nurse") or {}).get("name"),
                "nurse_initials": (item.get("nurse") or {}).get("initials"),
            }
            for item in assignments
        ],
        "module_outputs": {
            "risk_scorer": latest_vital.get("risk_score") if latest_vital else None,
            "urgency_classifier": latest_soap.get("urgency_level") if latest_soap else None,
            "ner": latest_soap.get("entities") if latest_soap else [],
        },
        "patient_id": resolved_id,
    }


def _load_patient_context_from_local_db(db: Session, patient_id: int):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return None

    soap = db.query(SOAPNote).filter(SOAPNote.patient_id == patient_id).order_by(SOAPNote.created_at.desc()).first()
    vital = db.query(Vital).filter(Vital.patient_id == patient_id).order_by(Vital.recorded_at.desc()).first()

    return {
        "patient_profile": {
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "chief_complaint": patient.chief_complaint,
        },
        "vitals": {
            "heart_rate": vital.heart_rate if vital else None,
            "blood_pressure_sys": vital.blood_pressure_sys if vital else None,
            "blood_pressure_dia": vital.blood_pressure_dia if vital else None,
            "spo2": vital.spo2 if vital else None,
            "temperature": vital.temperature if vital else None,
            "risk_score": vital.risk_score if vital else None,
            "recorded_at": _normalise_datetime(vital.recorded_at) if vital else None,
        },
        "soap_note": {
            "subjective": soap.subjective if soap else None,
            "objective": soap.objective if soap else None,
            "assessment": soap.assessment if soap else None,
            "plan": soap.plan if soap else None,
            "raw_text": soap.raw_text if soap else None,
            "entities": soap.entities if soap and hasattr(soap, "entities") else [],
            "urgency_level": soap.urgency_level if soap else None,
            "urgency_confidence": soap.urgency_confidence if soap else None,
            "recorded_at": _normalise_datetime(soap.created_at) if soap else None,
        },
        "module_outputs": {
            "risk_scorer": vital.risk_score if vital else None,
            "urgency_classifier": soap.urgency_level if soap else None,
            "ner": soap.entities if soap and hasattr(soap, "entities") else [],
        },
        "patient_id": patient_id,
    }

@router.post("/")
async def chat(payload: ChatMessage, db: Session = Depends(get_db)):
    """
    Entry point for the RAG chatbot.
    Retrieves latest patient context from DB and hands it to Ollama.
    """
    patient_context_data = None

    if payload.patient_id is not None:
        patient_context_data = _load_patient_context_from_supabase(payload.message, payload.patient_id)
        if patient_context_data is None:
            patient_context_data = _load_patient_context_from_local_db(db, payload.patient_id)
    else:
        patient_context_data = _load_patient_context_from_supabase(payload.message, None)

    reply, sources = answer(payload.message, patient_context=patient_context_data)
    
    return {
        "text": reply,
        "source": "; ".join(sources) if sources else "Clinical Knowledge Base"
    }


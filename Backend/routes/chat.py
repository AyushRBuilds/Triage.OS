from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

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

@router.post("/")
async def chat(payload: ChatMessage, db: Session = Depends(get_db)):
    """
    Entry point for the RAG chatbot.
    Retrieves latest patient context from DB and hands it to Ollama.
    """
    patient_context_data = None
    
    if payload.patient_id:
        # Fetch latest info for this patient to build a context block
        patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
        if patient:
            # Get latest SOAP note (for NER/Urgency)
            soap = db.query(SOAPNote).filter(SOAPNote.patient_id == payload.patient_id).order_by(SOAPNote.created_at.desc()).first()
            # Get latest vitals (for Risk)
            vital = db.query(Vital).filter(Vital.patient_id == payload.patient_id).order_by(Vital.recorded_at.desc()).first()
            
            patient_context_data = {
                "transcript": soap.raw_text if soap else "N/A",
                "entities": soap.entities if soap and hasattr(soap, 'entities') else [],
                "urgency_level": soap.subjective if soap else "N/A", # Or fetch from a specific field
                "risk_score": vital.risk_score if vital else 0.0,
            }
            
    reply, sources = answer(payload.message, patient_context=patient_context_data)
    
    return {
        "text": reply,
        "source": "; ".join(sources) if sources else "Clinical Knowledge Base"
    }


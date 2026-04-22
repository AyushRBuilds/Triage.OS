from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SOAPNote
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class SOAPCreate(BaseModel):
    patient_id: int
    raw_text: Optional[str] = None   # raw transcript / notes
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None


class SOAPOut(SOAPCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/{patient_id}", response_model=list[SOAPOut])
def get_soap_notes(patient_id: int, db: Session = Depends(get_db)):
    return db.query(SOAPNote).filter(SOAPNote.patient_id == patient_id).all()


@router.post("/", response_model=SOAPOut)
def create_soap_note(payload: SOAPCreate, db: Session = Depends(get_db)):
    """
    Accepts raw text OR pre-structured SOAP fields.
    If only raw_text is provided, the AI pipeline auto-fills S/O/A/P.
    """
    data = payload.dict()

    # Auto-run pipeline if SOAP fields are missing but raw_text is present
    if data.get("raw_text") and not any(
        data.get(f) for f in ("subjective", "objective", "assessment", "plan")
    ):
        try:
            from ai.soap_pipeline import run_pipeline
            result = run_pipeline(data["raw_text"])
            data["subjective"] = result["subjective"]
            data["objective"]  = result["objective"]
            data["assessment"] = result["assessment"]
            data["plan"]       = result["plan"]
            
            # Save AI Metadata
            data["urgency_level"]      = result.get("urgency_level")
            data["urgency_confidence"] = result.get("urgency_confidence")
            data["entities"]           = result.get("entities")
        except Exception as e:
            # Fail gracefully — save note without AI fields
            pass

    note = SOAPNote(**data)
    db.add(note)
    db.commit()
    db.refresh(note)
    
    # Sync to Supabase
    try:
        from supabase_sync import sync_soap_to_supabase
        sync_soap_to_supabase(data["patient_id"], data)
    except Exception:
        pass
        
    return note

class RawTextPayload(BaseModel):
    raw_text: str

@router.post("/process_raw")
def process_raw_text(payload: RawTextPayload):
    """
    Takes raw clinical text and runs it through the NER and Urgency Classifier.
    Returns the parsed SOAP structured dictionaries WITHOUT saving to the database.
    Used by the Frontend when the user speaks into the microphone.
    """
    if not payload.raw_text:
        raise HTTPException(status_code=400, detail="raw_text is required")
        
    try:
        from ai.soap_pipeline import run_pipeline
        return run_pipeline(payload.raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


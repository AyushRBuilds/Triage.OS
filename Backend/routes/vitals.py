from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Vital
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class VitalCreate(BaseModel):
    patient_id: int
    heart_rate: Optional[float] = None
    blood_pressure_sys: Optional[float] = None
    blood_pressure_dia: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    risk_score: Optional[float] = None


class VitalOut(VitalCreate):
    id: int
    recorded_at: datetime

    model_config = {"from_attributes": True}


from ai.risk_scorer import predict, explain

@router.get("/{patient_id}", response_model=list[VitalOut])
def get_vitals(patient_id: int, db: Session = Depends(get_db)):
    return db.query(Vital).filter(Vital.patient_id == patient_id).all()


@router.post("/", response_model=VitalOut)
def record_vital(payload: VitalCreate, db: Session = Depends(get_db)):
    data = payload.dict()
    
    # Auto-calculate risk score if not provided
    if data.get("risk_score") is None:
        try:
            # We need these keys for the model
            features = {
                "heart_rate": data.get("heart_rate"),
                "blood_pressure_sys": data.get("blood_pressure_sys"),
                "blood_pressure_dia": data.get("blood_pressure_dia"),
                "spo2": data.get("spo2"),
                "temperature": data.get("temperature"),
            }
            # Only predict if we have the minimum required vitals
            if all(v is not None for v in features.values()):
                data["risk_score"] = predict(features)
        except Exception:
            pass

    vital = Vital(**data)
    db.add(vital)
    db.commit()
    db.refresh(vital)
    
    # Sync to Supabase
    try:
        from supabase_sync import sync_vitals_to_supabase
        sync_vitals_to_supabase(data["patient_id"], data)
    except Exception:
        pass
        
    return vital


@router.get("/explain/{vital_id}")
def explain_vital_risk(vital_id: int, db: Session = Depends(get_db)):
    """Return SHAP explanation for a specific vitals reading."""
    vital = db.query(Vital).filter(Vital.id == vital_id).first()
    if not vital:
        raise HTTPException(status_code=404, detail="Vital reading not found")
        
    features = {
        "heart_rate": vital.heart_rate,
        "blood_pressure_sys": vital.blood_pressure_sys,
        "blood_pressure_dia": vital.blood_pressure_dia,
        "spo2": vital.spo2,
        "temperature": vital.temperature,
    }
    
    try:
        explanation = explain(features)
        return {
            "vital_id": vital_id,
            "risk_score": vital.risk_score,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")


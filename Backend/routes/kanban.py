from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Patient
from pydantic import BaseModel

router = APIRouter()

VALID_LANES = {"waiting", "in_progress", "done"}


class KanbanMove(BaseModel):
    patient_id: int
    lane: str


@router.get("/")
def get_board(db: Session = Depends(get_db)):
    """Return patients grouped by Kanban lane."""
    patients = db.query(Patient).all()
    board = {lane: [] for lane in VALID_LANES}
    for p in patients:
        board.setdefault(p.kanban_lane, []).append(
            {"id": p.id, "name": p.name, "chief_complaint": p.chief_complaint}
        )
    return board


@router.patch("/move")
def move_patient(payload: KanbanMove, db: Session = Depends(get_db)):
    if payload.lane not in VALID_LANES:
        raise HTTPException(status_code=400, detail=f"Invalid lane. Choose from {VALID_LANES}")
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.kanban_lane = payload.lane
    db.commit()
    return {"detail": f"Patient {payload.patient_id} moved to '{payload.lane}'"}

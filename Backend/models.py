from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Patient(Base):
    __tablename__ = "patients"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    age         = Column(Integer)
    gender      = Column(String)
    chief_complaint = Column(Text)
    kanban_lane = Column(String, default="waiting")  # waiting | in_progress | done
    created_at  = Column(DateTime, default=datetime.utcnow)

    vitals      = relationship("Vital", back_populates="patient")
    soap_notes  = relationship("SOAPNote", back_populates="patient")


class Vital(Base):
    __tablename__ = "vitals"

    id           = Column(Integer, primary_key=True, index=True)
    patient_id   = Column(Integer, ForeignKey("patients.id"), nullable=False)
    heart_rate   = Column(Float)
    blood_pressure_sys = Column(Float)
    blood_pressure_dia = Column(Float)
    spo2         = Column(Float)
    temperature  = Column(Float)
    risk_score   = Column(Float)
    recorded_at  = Column(DateTime, default=datetime.utcnow)

    patient      = relationship("Patient", back_populates="vitals")


from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON

class SOAPNote(Base):
    __tablename__ = "soap_notes"

    id           = Column(Integer, primary_key=True, index=True)
    patient_id   = Column(Integer, ForeignKey("patients.id"), nullable=False)
    subjective   = Column(Text)
    objective    = Column(Text)
    assessment   = Column(Text)
    plan         = Column(Text)
    raw_text     = Column(Text)
    
    # AI Metadata
    urgency_level      = Column(String)
    urgency_confidence = Column(Float)
    entities           = Column(JSON)  # Stores extracted entities as list/dict
    
    created_at   = Column(DateTime, default=datetime.utcnow)

    patient      = relationship("Patient", back_populates="soap_notes")

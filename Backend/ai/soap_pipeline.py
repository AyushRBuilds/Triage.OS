"""
SOAP Pipeline
-------------
Connects the NER model and urgency classifier to produce
structured SOAP notes from raw clinical text.

Usage:
    from ai.soap_pipeline import run_pipeline
    result = run_pipeline("Patient complains of chest pain...")
"""
from ai.ner_model import extract as ner_extract
from ai.urgency_classifier import classify as urgency_classify

# Entity labels that map to each SOAP section
_SUBJECTIVE_LABELS  = {"SYMPTOM", "COMPLAINT", "HISTORY", "DURATION"}
_OBJECTIVE_LABELS   = {"VITAL", "LAB", "MEASUREMENT", "TEST", "FINDING"}
_ASSESSMENT_LABELS  = {"DISEASE", "CONDITION", "DIAGNOSIS", "DISORDER"}
_PLAN_LABELS        = {"DRUG", "TREATMENT", "PROCEDURE", "MEDICATION", "DOSAGE"}


def _group_entities(entities: list[dict]) -> dict[str, list[str]]:
    """Sort extracted entities into SOAP buckets."""
    groups: dict[str, list[str]] = {
        "subjective": [], "objective": [], "assessment": [], "plan": [], "other": []
    }
    for ent in entities:
        label = ent["label"].upper()
        if label in _SUBJECTIVE_LABELS:
            groups["subjective"].append(ent["text"])
        elif label in _OBJECTIVE_LABELS:
            groups["objective"].append(ent["text"])
        elif label in _ASSESSMENT_LABELS:
            groups["assessment"].append(ent["text"])
        elif label in _PLAN_LABELS:
            groups["plan"].append(ent["text"])
        else:
            groups["other"].append(ent["text"])
    return groups


def run_pipeline(raw_text: str) -> dict:
    """
    Process raw clinical text and return a structured SOAP note.

    Steps:
    1. Run NER to extract medical entities
    2. Run urgency classifier to get triage level
    3. Map entities → S/O/A/P sections

    Returns:
        {
            "subjective":    str,
            "objective":     str,
            "assessment":    str,
            "plan":          str,
            "entities":      list,
            "urgency_level": str,
            "urgency_confidence": float,
        }
    """
    # Step 1 — Named Entity Recognition
    entities = ner_extract(raw_text)

    # Step 2 — Urgency classification
    urgency = urgency_classify(raw_text)

    # Step 3 — Group entities into SOAP sections
    groups = _group_entities(entities)

    # Step 4 — Optional: Extract numeric vitals for a "preliminary" risk score
    # Look for patterns like "Heart Rate: 120", "BP 140/90", etc.
    import re
    text = raw_text.lower()
    prelim_risk = None
    try:
        from ai.risk_scorer import predict
        vitals_found = {}
        
        hr_match = re.search(r'(heart rate|hr|pulse|bpm)\D*(\d+)', text)
        if hr_match: vitals_found["heart_rate"] = float(hr_match.group(2))
        
        spo2_match = re.search(r'(spo2|oxygen|o2)\D*(\d+)', text)
        if spo2_match: vitals_found["spo2"] = float(spo2_match.group(2))
        
        bp_match = re.search(r'(bp|pressure)\D*(\d+)\D+(\d+)', text)
        if bp_match:
            vitals_found["blood_pressure_sys"] = float(bp_match.group(2))
            vitals_found["blood_pressure_dia"] = float(bp_match.group(3))
            
        temp_match = re.search(r'(temp|temperature)\D*(\d+\.?\d*)', text)
        if temp_match: vitals_found["temperature"] = float(temp_match.group(2))

        # If we have enough for a guestimate
        if len(vitals_found) >= 3:
            # fill missing with defaults for a "best guess"
            defaults = {"heart_rate": 75, "spo2": 98, "blood_pressure_sys": 120, "blood_pressure_dia": 80, "temperature": 36.6}
            for k, v in defaults.items():
                if k not in vitals_found: vitals_found[k] = v
            prelim_risk = predict(vitals_found)
    except Exception:
        pass

    def _join(items: list[str]) -> str:
        return "; ".join(dict.fromkeys(items))  # dedupe, preserve order

    return {
        "subjective":         _join(groups["subjective"])  or raw_text[:300],
        "objective":          _join(groups["objective"]),
        "assessment":         _join(groups["assessment"]),
        "plan":               _join(groups["plan"]),
        "entities":           entities,
        "urgency_level":      urgency["label"],
        "urgency_confidence": urgency["confidence"],
        "preliminary_risk":   prelim_risk,
    }


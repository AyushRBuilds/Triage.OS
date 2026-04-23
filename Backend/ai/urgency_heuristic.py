"""
Heuristic triage-urgency scoring when the ML classifier is unavailable or errors.
No PyTorch / transformers required — used as a safe fallback in soap_pipeline.
Labels match the trained model: STAT, URGENT, ROUTINE.
"""
import re

# Typo Tolerant tokens (speech-to-text / dictation)
_STAT_TERMS = (
    "cardiac arrest", "not breathing", "anaphylaxis", "code blue", "stemi", "asystole",
    "gcs 3", "unresponsive", "pulseless", "pea", "v tach", "vfib", "status epilepticus",
    "mucardial",  # common STT for "myocardial"
    "myocardial infarction", "st elevation", "st-elevation",
)
_URGENT_TERMS = (
    "chest pain", "mi", "myocardial", "infarction", "infraction",
    "infarct", "nstemi", "suspected", "shortness of breath", "sob", "dyspnea",
    "tachycardia", "hypotens", "syncope", "palpitation", "nitro", "aspirin 325",
)


def _spo2_severe(text: str) -> bool:
    t = text.lower()
    m = re.search(
        r"(?:spo2|sp\s*o2|sats?|oxygen|o2)\D{0,20}?(\d{1,3})\s*%",
        t,
    ) or re.search(
        r"(?:^|\D)sp.{0,15}?(?:o2|or|to)\D{0,8}(\d{1,3})(?!\d)",
        t,
    )
    if m:
        try:
            return int(m.group(1)) < 90
        except ValueError:
            return False
    return False


def classify_urgency_heuristic(text: str) -> dict:
    """
    Return STAT / URGENT / ROUTINE and a rough confidence.
    When ML fails, this still drives the triage UI and SOAP prompts.
    """
    t = (text or "").lower()

    if not t.strip():
        return {"label": "ROUTINE", "confidence": 0.4, "scores": {"_heuristic": 1.0}, "source": "heuristic"}

    if _spo2_severe(text):
        return {"label": "STAT", "confidence": 0.78, "scores": {"_heuristic": 1.0}, "source": "heuristic"}

    # Hypertension + cardiac context: e.g. "160 over 95", "160/95", "160 95"
    m = re.search(
        r"(?:bp|blood pressure|pressure)\D{0,8}(\d{2,3})\s*(?:/|over)\s*(\d{2,3})",
        t, re.I,
    ) or re.search(r"(\d{2,3})\s*/\s*(\d{2,3})", t)
    if m:
        sysv, diav = int(m.group(1)), int(m.group(2))
        if 160 <= sysv <= 260 and 80 <= diav <= 140:
            if "chest" in t and "pain" in t:
                return {"label": "STAT", "confidence": 0.76, "scores": {"_heuristic": 1.0}, "source": "heuristic"}
            if re.search(r"mio?card|infar|suspect", t):
                return {"label": "STAT", "confidence": 0.75, "scores": {"_heuristic": 1.0}, "source": "heuristic"}
            return {"label": "URGENT", "confidence": 0.68, "scores": {"_heuristic": 1.0}, "source": "heuristic"}

    for s in _STAT_TERMS:
        if s in t:
            return {"label": "STAT", "confidence": 0.74, "scores": {"_heuristic": 1.0}, "source": "heuristic"}

    for s in _URGENT_TERMS:
        if s in t:
            return {"label": "URGENT", "confidence": 0.66, "scores": {"_heuristic": 1.0}, "source": "heuristic"}

    if "pain" in t or "suspected" in t:
        return {"label": "URGENT", "confidence": 0.58, "scores": {"_heuristic": 1.0}, "source": "heuristic"}

    return {"label": "ROUTINE", "confidence": 0.55, "scores": {"_heuristic": 1.0}, "source": "heuristic"}

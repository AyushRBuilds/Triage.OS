"""
SOAP Pipeline
-------------
<<<<<<< HEAD
Connects the NER model and urgency classifier to produce
=======
Connects the NER model, urgency classifier, and OpenRouter LLM to produce
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
structured SOAP notes from raw clinical text.

Usage:
    from ai.soap_pipeline import run_pipeline
    result = run_pipeline("Patient complains of chest pain...")
"""
<<<<<<< HEAD
from ai.ner_model import extract as ner_extract
from ai.urgency_classifier import classify as urgency_classify

# Entity labels that map to each SOAP section
=======
import os
import re
import json
import logging
import requests

from ai.ner_model import extract as ner_extract
from ai.urgency_heuristic import classify_urgency_heuristic

logger = logging.getLogger(__name__)

# ── OpenRouter config ─────────────────────────────────────────
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")

# Entity labels that map to each SOAP section (used as fallback)
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
_SUBJECTIVE_LABELS  = {"SYMPTOM", "COMPLAINT", "HISTORY", "DURATION"}
_OBJECTIVE_LABELS   = {"VITAL", "LAB", "MEASUREMENT", "TEST", "FINDING"}
_ASSESSMENT_LABELS  = {"DISEASE", "CONDITION", "DIAGNOSIS", "DISORDER"}
_PLAN_LABELS        = {"DRUG", "TREATMENT", "PROCEDURE", "MEDICATION", "DOSAGE"}


def _group_entities(entities: list[dict]) -> dict[str, list[str]]:
<<<<<<< HEAD
    """Sort extracted entities into SOAP buckets."""
=======
    """Sort extracted entities into SOAP buckets (fallback method)."""
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
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


<<<<<<< HEAD
=======
def _call_openrouter(messages: list[dict], json_mode: bool = False, timeout: int = 60) -> str | None:
    """
    Call the OpenRouter API with the given messages.
    Returns the assistant's response text, or None on failure.
    """
    api_key = OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
    model = OPENROUTER_MODEL or os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")

    if not api_key:
        logger.warning("OPENROUTER_API_KEY not set — skipping LLM call")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Triage.OS",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 2048,
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"OpenRouter API call failed: {e}")
        return None


def _parse_llm_json(raw_response: str) -> dict | None:
    """Parse a JSON response from the LLM, stripping markdown fences if present."""
    try:
        cleaned = raw_response.strip()
        # Strip markdown code fences
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Failed to parse LLM JSON: {e}\nRaw: {raw_response[:500]}")
        return None


def _as_str(v) -> str:
    """Coerce LLM field values to a safe string (handles null, numbers, non-str)."""
    if v is None:
        return ""
    if isinstance(v, str):
        return v.strip()
    if isinstance(v, (int, float, bool)):
        return str(v).strip()
    if isinstance(v, (dict, list)):
        return ""
    return str(v).strip() if v else ""


def _normalize_llm_soap(result: dict) -> dict:
    """
    Map alternate / nested LLM keys to subjective, objective, assessment, plan.
    Some models return {"S": "...", "O": "..."} or nest under "soap" / "note".
    """
    if not isinstance(result, dict):
        return {}
    out: dict[str, str] = {}
    # Flatten one level of nesting
    candidates: dict = dict(result)
    for wrap in ("soap", "note", "SOAP", "data"):
        if wrap in result and isinstance(result[wrap], dict):
            for k, v in result[wrap].items():
                if k not in candidates:
                    candidates[k] = v
    pairs = [
        ("subjective", ("subjective", "Subjective", "S", "s", "subj", "subject")),
        ("objective", ("objective", "Objective", "O", "o", "obj", "Object")),
        ("assessment", ("assessment", "Assessment", "A", "a", "impression", "Impression", "diagnosis", "Diagnosis")),
        ("plan", ("plan", "Plan", "P", "p", "treatment_plan", "treatment", "interventions")),
    ]
    for canon, keys in pairs:
        for k in keys:
            if k in candidates:
                t = _as_str(candidates[k])
                if t:
                    out[canon] = t
                    break
    return out


def _llm_to_flat(result: dict) -> dict:
    """
    Build a single flat dict with the four SOAP keys from a parsed LLM response.
    Merges top-level and normalized (S/O/A/P) keys; empty string if missing.
    """
    if not isinstance(result, dict):
        return {}
    norm = _normalize_llm_soap(result)
    out: dict[str, str] = {}
    for k in ("subjective", "objective", "assessment", "plan"):
        out[k] = _as_str(norm.get(k)) or _as_str(result.get(k))
    return out


def _format_soap_with_llm(raw_text: str, entities: list[dict], urgency: dict) -> dict | None:
    """
    Use OpenRouter LLM to convert raw transcript + extracted entities into
    properly formatted SOAP note sentences.

    Returns dict with 'subjective', 'objective', 'assessment', 'plan'
    or None if the LLM call fails completely.
    
    Accepts partial results — fills in missing sections with contextual defaults
    rather than discarding the entire response.
    """
    # Build entity context string for the prompt
    entity_summary = ", ".join(
        f"{e['text']} ({e['label']})" for e in entities
    ) if entities else "None extracted"

    system_prompt = (
        "You are an expert clinical medical scribe working in a hospital emergency department. "
        "Your task is to convert raw clinical transcripts into professional SOAP notes. "
        "You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no commentary. "
        "Every section MUST contain 1-3 complete, professional clinical sentences. NEVER leave a section empty."
    )

    user_prompt = f"""Convert this raw clinical transcript into a structured SOAP note.

TRANSCRIPT:
\"{raw_text}\"

EXTRACTED MEDICAL ENTITIES: {entity_summary}
TRIAGE URGENCY: {urgency.get('label', 'Unknown')} (confidence: {urgency.get('confidence', 0):.1%})

INSTRUCTIONS — follow these exactly:
1. **Subjective (S):** Write 1-3 sentences summarizing patient demographics, chief complaint, reported symptoms, onset, duration, and relevant history. Use narrative clinical prose.
2. **Objective (O):** Write 1-3 sentences documenting vital signs (format: HR ___ bpm, BP ___/___ mmHg, SpO2 __%, Temp ___°C, RR ___ breaths/min), physical exam findings, and any labs/tests mentioned. If specific values were mentioned in the transcript, include them.
3. **Assessment (A):** Write 1-2 sentences with clinical impression, suspected diagnoses, severity, and triage classification.
4. **Plan (P):** Write 1-3 sentences covering immediate interventions, medications with doses/routes, orders, consults, and disposition.

CRITICAL RULES:
- Write in complete professional clinical sentences, NOT bullet points or semicolon-separated lists.
- EVERY section must have content. If the transcript lacks info for a section, write a clinically appropriate default (e.g., "Vital signs to be obtained" for missing vitals).
- Use standard medical abbreviations where appropriate.

Respond with ONLY this JSON (fill in the quoted values):
{{"subjective": "...", "objective": "...", "assessment": "...", "plan": "..."}}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    # Attempt 1
    raw_response = _call_openrouter(messages, json_mode=True, timeout=60)
    if raw_response:
        result = _parse_llm_json(raw_response)
        if result and isinstance(result, dict):
            flat = _llm_to_flat(result)
            soap = _validate_and_fill_soap(flat, raw_text, entities, urgency)
            if soap:
                logger.info("LLM SOAP formatting successful (attempt 1)")
                return soap

    # Attempt 2 — retry with slightly higher temperature
    logger.info("LLM attempt 1 failed, retrying...")
    raw_response = _call_openrouter(messages, json_mode=False, timeout=60)
    if raw_response:
        result = _parse_llm_json(raw_response)
        if result and isinstance(result, dict):
            flat = _llm_to_flat(result)
            soap = _validate_and_fill_soap(flat, raw_text, entities, urgency)
            if soap:
                logger.info("LLM SOAP formatting successful (attempt 2)")
                return soap

    return None


def _validate_and_fill_soap(
    result: dict,
    raw_text: str,
    entities: list[dict],
    urgency: dict,
) -> dict | None:
    """
    Validate an LLM result dict and fill in any missing/empty sections
    with contextual defaults rather than rejecting the whole response.
    """
    if not isinstance(result, dict):
        return None

    # Check if we have at least one valid section
    valid_count = 0
    for key in ("subjective", "objective", "assessment", "plan"):
        val = _as_str(result.get(key))
        if val:
            valid_count += 1

    # If no valid sections at all, this response is useless
    if valid_count == 0:
        return None

    # Build contextual fallbacks for missing sections
    groups = _group_entities(entities)
    urgency_label = urgency.get("label", "Unknown")
    urgency_conf = urgency.get("confidence", 0)

    symptoms = ", ".join(groups["subjective"]) if groups["subjective"] else ""
    vitals = ", ".join(groups["objective"]) if groups["objective"] else ""
    conditions = ", ".join(groups["assessment"]) if groups["assessment"] else ""
    treatments = ", ".join(groups["plan"]) if groups["plan"] else ""

    fallbacks = {
        "subjective": (
            f"Patient presents with {symptoms}. "
            f"Further history to be obtained at bedside."
            if symptoms else
            f"Patient presents with the following complaint: {raw_text[:200]}. "
            f"Detailed history to be obtained."
        ),
        "objective": (
            f"Documented vitals: {vitals}. "
            f"Complete physical examination pending."
            if vitals else
            "Vital signs to be obtained. Physical examination pending."
        ),
        "assessment": (
            f"Clinical impression: {conditions}. "
            f"Triage urgency classified as {urgency_label} ({urgency_conf:.0%} confidence)."
            if conditions else
            f"Clinical assessment in progress. "
            f"Triage urgency classified as {urgency_label} ({urgency_conf:.0%} confidence). "
            f"Further workup required."
        ),
        "plan": (
            f"Initiate treatment: {treatments}. "
            f"Continue monitoring and reassess."
            if treatments else
            f"Initiate standard workup per triage protocol. "
            f"Monitor vitals. Reassess after initial interventions."
        ),
    }

    soap = {}
    for key in ("subjective", "objective", "assessment", "plan"):
        val = _as_str(result.get(key))
        if val and len(val) > 5:
            soap[key] = val
        else:
            logger.info(f"Filling missing SOAP section '{key}' with contextual fallback")
            soap[key] = fallbacks[key]

    return soap


def _age_snippet_from_text(text: str) -> str:
    m = re.search(r'\b(\d{1,3})\s*(?:year|yr)[s]?\s*old', text, re.I)
    if m and 1 <= int(m.group(1)) <= 120:
        return f"{m.group(1)}-year-old"
    return ""


def _build_structured_fallback(
    raw_text: str,
    entities: list[dict],
    urgency: dict,
) -> dict:
    """
    Build a structured SOAP note from NER entities and raw text
    when the LLM is completely unavailable. Produces readable clinical
    sentences instead of raw entity dumps.
    """
    groups = _group_entities(entities)
    urgency_label = urgency.get("label", "Unknown")
    urgency_conf = urgency.get("confidence", 0)

    symptoms = list(dict.fromkeys(groups["subjective"]))  # deduplicate, preserve order
    vitals = list(dict.fromkeys(groups["objective"]))
    conditions = list(dict.fromkeys(groups["assessment"]))
    treatments = list(dict.fromkeys(groups["plan"]))

    # ── Subjective ──
    if symptoms:
        s_text = f"Patient presents with {', '.join(symptoms)}."
    else:
        # Use first portion of raw text as context
        s_text = f"Patient presents with the following concern: {raw_text[:250].strip()}."
    age = _age_snippet_from_text(raw_text)
    if age and age not in s_text:
        s_text = f"{age} patient. {s_text}"

    # ── Objective ──
    if vitals:
        o_text = f"Documented findings: {', '.join(vitals)}. Complete assessment pending."
    else:
        # Try to extract vitals from raw text with regex
        extracted = _extract_vitals_text(raw_text)
        if extracted:
            o_text = f"Documented vitals: {extracted}. Full physical examination pending."
        else:
            o_text = "Vital signs and physical examination findings to be documented."

    # ── Assessment ──
    if conditions:
        a_text = (
            f"Clinical impression suggests {', '.join(conditions)}. "
            f"Triage urgency: {urgency_label} ({urgency_conf:.0%} confidence)."
        )
    else:
        a_text = (
            f"Clinical assessment in progress based on presenting symptoms. "
            f"Triage urgency classified as {urgency_label} ({urgency_conf:.0%} confidence). "
            f"Further diagnostic workup required."
        )

    # ── Plan ──
    if treatments:
        p_text = (
            f"Initiate: {', '.join(treatments)}. "
            f"Continue monitoring vitals and reassess clinical status."
        )
    else:
        p_text = (
            f"Initiate standard workup per triage protocol for {urgency_label} urgency. "
            f"Monitor vitals continuously. Reassess after initial interventions."
        )

    return {
        "subjective": s_text,
        "objective": o_text,
        "assessment": a_text,
        "plan": p_text,
    }


def _extract_vitals_text(raw_text: str) -> str:
    """Extract vitals from raw text using regex and format them properly."""
    text = raw_text.lower()
    found: list[str] = []
    seen: set[str] = set()

    def add(s: str) -> None:
        if s not in seen:
            seen.add(s)
            found.append(s)

    # HR: "heart rate 140", "140 PPM" (STT)
    m = re.search(r'(?:heart rate|hr|pulse)\D*(\d{2,3})', text) or re.search(
        r'(\d{2,3})\s*ppm(?!\s*%)', text, re.I,
    )
    if m and 20 <= int(m.group(1)) <= 250:
        add(f"HR {m.group(1)} bpm")

    # BP: "BP/VP/pressure" + 90/60; "VP" often from speech for vitals/pressure
    m = re.search(
        r'(?:^|\s)(?:bp|vp|blood pressure|pressure)\s*(\d{2,3})\s*/\s*(\d{2,3})', text, re.I,
    )
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        if 40 <= a <= 300 and 20 <= b <= 200 and a > b - 20:
            add(f"BP {a}/{b} mmHg")
    if "BP" not in seen:
        m = re.search(
            r'(?:^|[^\d])(\d{2,3})\s*/\s*(\d{2,3})(?=\s*(?:temp|t\.|suspe|hr|and\s+success|and\s+immediate|\s*and\s*immediate|$))',
            text,
        )
        if m:
            a, b = int(m.group(1)), int(m.group(2))
            if 50 <= a <= 220 and 30 <= b <= 120 and a > b - 5:
                add(f"BP {a}/{b} mmHg")

    # SpO2: include garbled STT e.g. "sp or to 82" for SpO2
    m = re.search(
        r'(?:spo2|sp\s*o2|sats?|oxygen)\D{0,12}(\d{1,3})\s*%',
        text, re.I,
    ) or re.search(r'(?:^|\s)sp.{0,20}?(?:o2|0\s*2|or|to)\D{0,8}(\d{1,3})(?!\d)', text, re.I)
    if m:
        n = int(m.group(1))
        if 40 <= n <= 100 or (0 < n < 100):
            add(f"SpO2 {n}%")

    m = re.search(
        r'(?:temp|temperature|t\.)\D{0,8}(\d{2,3}\.?\d*)', text, re.I,
    ) or re.search(
        r'(?:^|\D)(\d{2,3}\.?\d*)\D{0,4}(?:degree|celcius|celsius)\b', text, re.I,
    )
    if m:
        tv = m.group(1)
        tfn = float(tv)
        if 35.0 <= tfn <= 42.3:
            add(f"Temp {tv}°C")

    m = re.search(r'(?:^|\s)(?:rr|respiratory rate|resp rate)\D*(\d{1,2})', text, re.I)
    if m and 4 <= int(m.group(1)) <= 50:
        add(f"RR {m.group(1)} breaths/min")

    return ", ".join(found) if found else ""


def _extract_assessment_from_text(text: str) -> str:
    """Pull assessment-style phrases from free text (e.g. suspected diagnosis)."""
    t = text.strip()
    m = re.search(
        r'(?:suspected|suspicious for|impression[:\s]+|likely)\s+([^.;\n]+?)(?=\s+(?:and|immediate|iv|ct|order|started|\.))',
        t, re.I,
    ) or re.search(r'suspected\s+([^.;\n]+)', t, re.I)
    if m:
        s = m.group(1).strip()
        if 5 < len(s) < 200:
            return f"Notable concern from transcript: {s}."
    return ""


def _extract_plan_from_text(text: str) -> str:
    """Heuristic extraction of plan elements from noisy speech-to-text."""
    hints = []
    t = text.lower()
    if re.search(r'\biv\s+flui?d?|intravenous\s+flui?d?|i\.?\s*v\.?\s*fluid', t):
        hints.append("IV fluid administration per protocol as documented")
    if re.search(r'\bct\s+scan|cat\s*scan|city\s*scan|c\.?\s*t\.?\s*head|imaging', t):
        hints.append("Imaging/CT as ordered in transcript")
    if re.search(r'\bstarted\b|ordered|\b(?:mg|gram|g)\b.*\b(?:cef|zosc|flox|clin|axone)|antibiotic|abx', t, re.I):
        hints.append("Medication(s) or antibiotic therapy as initiated per transcript; verify in chart")
    if re.search(r'\bfluid\s*bolus?|resuscit', t):
        hints.append("Resuscitation and fluid support as indicated")
    return " ".join(hints) if hints else ""


def _finalize_soap(
    soap: dict,
    raw_text: str,
    entities: list[dict],
    urgency: dict,
) -> dict:
    """
    Never return empty/None sections; merge regex-derived vitals; append transcript hints for A/P.
    """
    fb = _build_structured_fallback(raw_text, entities, urgency)
    out: dict[str, str] = {}
    for k in ("subjective", "objective", "assessment", "plan"):
        v = _as_str(soap.get(k)) if isinstance(soap, dict) else ""
        if not v or len(v) < 5:
            out[k] = fb[k]
        else:
            out[k] = v
    o_extra = _extract_vitals_text(raw_text)
    if o_extra and o_extra.lower() not in out["objective"].lower():
        o = out["objective"].rstrip()
        if not o.endswith("."):
            o += "."
        out["objective"] = f"{o} Transcript also documents: {o_extra}."
    a_add = _extract_assessment_from_text(raw_text)
    if a_add and a_add.lower() not in out["assessment"].lower():
        out["assessment"] = out["assessment"].rstrip(".") + f" {a_add}"
    p_add = _extract_plan_from_text(raw_text)
    if p_add:
        for chunk in p_add.split(". "):
            c = (chunk or "").strip()
            if c and c[:40].lower() not in out["plan"].lower():
                out["plan"] = out["plan"].rstrip(".") + f" {c}."
    return out


def _extract_prelim_risk(raw_text: str) -> float | None:
    """Extract numeric vitals from text and compute a preliminary risk score."""
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

        # If we have enough vitals for a reasonable estimate
        if len(vitals_found) >= 3:
            defaults = {
                "heart_rate": 75, "spo2": 98,
                "blood_pressure_sys": 120, "blood_pressure_dia": 80,
                "temperature": 36.6
            }
            for k, v in defaults.items():
                if k not in vitals_found:
                    vitals_found[k] = v
            prelim_risk = predict(vitals_found)
    except Exception:
        pass
    return prelim_risk


>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
def run_pipeline(raw_text: str) -> dict:
    """
    Process raw clinical text and return a structured SOAP note.

    Steps:
    1. Run NER to extract medical entities
    2. Run urgency classifier to get triage level
<<<<<<< HEAD
    3. Map entities → S/O/A/P sections
=======
    3. Use OpenRouter LLM to generate professional SOAP sentences
    4. Fall back to structured entity-based generation if LLM is unavailable
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b

    Returns:
        {
            "subjective":    str,
            "objective":     str,
            "assessment":    str,
            "plan":          str,
            "entities":      list,
            "urgency_level": str,
            "urgency_confidence": float,
<<<<<<< HEAD
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
=======
            "preliminary_risk":   float | None,
        }
    """
    # Step 1 — Named Entity Recognition
    try:
        entities = ner_extract(raw_text)
    except Exception as e:
        logger.error(f"NER extraction failed: {e}")
        entities = []

    # Step 2 — Urgency classification (ML model; on failure use keyword/heuristic fallback).
    # Import lazily so a missing torch/transformers does not break the whole pipeline.
    try:
        from ai.urgency_classifier import classify as _urgency_classify
        urgency = _urgency_classify(raw_text)
    except Exception as e:
        logger.warning("Urgency ML classifier failed (%s) — using heuristic triage", e, exc_info=False)
        urgency = classify_urgency_heuristic(raw_text)

    # Step 3 — Use OpenRouter LLM to produce proper SOAP sentences
    soap_formatted = _format_soap_with_llm(raw_text, entities, urgency)

    # Step 4 — Fallback: build structured sentences from NER entities + raw text
    if soap_formatted is None:
        logger.info("LLM unavailable — using structured entity-based fallback")
        soap_formatted = _build_structured_fallback(raw_text, entities, urgency)

    # Step 4b — Ensure all sections are populated, merge vitals, apply transcript heuristics
    soap_formatted = _finalize_soap(soap_formatted, raw_text, entities, urgency)

    # Step 5 — Extract preliminary risk score from vitals in text
    prelim_risk = _extract_prelim_risk(raw_text)

    return {
        "subjective":         soap_formatted["subjective"],
        "objective":          soap_formatted["objective"],
        "assessment":         soap_formatted["assessment"],
        "plan":               soap_formatted["plan"],
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
        "entities":           entities,
        "urgency_level":      urgency["label"],
        "urgency_confidence": urgency["confidence"],
        "preliminary_risk":   prelim_risk,
    }
<<<<<<< HEAD

=======
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b

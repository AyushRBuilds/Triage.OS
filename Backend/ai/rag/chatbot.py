"""
RAG Chatbot
-----------
Combines retrieved clinical knowledge with a structured patient context.
"""
import os
from typing import Tuple, List, Optional

import requests as http_requests

from ai.rag.retriever import retrieve

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")


def _call_openrouter(messages: list[dict]) -> str | None:
    api_key = OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
    model = OPENROUTER_MODEL or os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")

    if not api_key:
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
        "temperature": 0.4,
        "max_tokens": 1024,
    }

    try:
        response = http_requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        return None


def _format_kv_block(title: str, values: dict) -> str:
    lines = []
    for key, value in values.items():
        if value in (None, "", [], {}):
            continue
        lines.append(f"{key}: {value}")
    if not lines:
        return ""
    return f"{title}\n" + "\n".join(lines)


def generate_patient_summary(model_outputs: dict) -> str:
    """
    Convert the full patient payload into a compact prompt block.

    Supports the richer chat payload:
    - patient_profile
    - vitals
    - soap_note
    - medications
    - assignments
    - module_outputs

    And still accepts the older flat shape used by earlier tests.
    """
    if not model_outputs:
        return ""

    patient = model_outputs.get("patient_profile") or {}
    vitals = model_outputs.get("vitals") or {}
    soap_note = model_outputs.get("soap_note") or {}
    module_outputs = model_outputs.get("module_outputs") or {}
    medications = model_outputs.get("medications") or []
    assignments = model_outputs.get("assignments") or []

    # Backward compatibility with the older flat context.
    if not patient and not vitals and not soap_note:
        patient = {
            "name": model_outputs.get("name"),
            "bed": model_outputs.get("bed"),
            "ward": model_outputs.get("ward"),
        }
        vitals = {
            "heart_rate": model_outputs.get("heart_rate"),
            "blood_pressure_sys": model_outputs.get("blood_pressure_sys"),
            "blood_pressure_dia": model_outputs.get("blood_pressure_dia"),
            "spo2": model_outputs.get("spo2"),
            "temperature": model_outputs.get("temperature"),
            "risk_score": model_outputs.get("risk_score"),
        }
        soap_note = {
            "raw_text": model_outputs.get("transcript"),
            "entities": model_outputs.get("entities") or [],
            "urgency_level": model_outputs.get("urgency_level"),
            "urgency_confidence": model_outputs.get("urgency_confidence"),
        }
        module_outputs = {
            "risk_scorer": model_outputs.get("risk_score"),
            "urgency_classifier": model_outputs.get("urgency_level"),
            "ner": model_outputs.get("entities") or [],
        }

    lines = ["--- PATIENT CLINICAL CONTEXT ---"]

    patient_block = _format_kv_block("Patient Profile", {
        "id": patient.get("id"),
        "name": patient.get("name"),
        "bed": patient.get("bed"),
        "ward": patient.get("ward"),
        "age": patient.get("age"),
        "gender": patient.get("gender"),
        "risk": patient.get("risk"),
        "chief_complaint": patient.get("chief_complaint"),
        "diagnosis": patient.get("diagnosis"),
    })
    if patient_block:
        lines.append(patient_block)

    vital_block = _format_kv_block("Latest Vitals", {
        "heart_rate": vitals.get("heart_rate"),
        "blood_pressure": (
            f"{vitals.get('blood_pressure_sys')}/{vitals.get('blood_pressure_dia')}"
            if vitals.get("blood_pressure_sys") is not None or vitals.get("blood_pressure_dia") is not None
            else None
        ),
        "spo2": vitals.get("spo2"),
        "temperature": vitals.get("temperature"),
        "risk_score": vitals.get("risk_score"),
        "recorded_at": vitals.get("recorded_at"),
    })
    if vital_block:
        lines.append(vital_block)

    soap_block = _format_kv_block("Latest SOAP Note", {
        "subjective": soap_note.get("subjective"),
        "objective": soap_note.get("objective"),
        "assessment": soap_note.get("assessment"),
        "plan": soap_note.get("plan"),
        "raw_text": soap_note.get("raw_text"),
        "urgency_level": soap_note.get("urgency_level"),
        "urgency_confidence": soap_note.get("urgency_confidence"),
    })
    if soap_block:
        lines.append(soap_block)

    entities = soap_note.get("entities") or model_outputs.get("entities") or []
    if entities:
        lines.append(f"NER Entities: {entities}")

    if medications:
        med_lines = []
        for med in medications:
            if isinstance(med, dict):
                med_lines.append(
                    f"- {med.get('name', 'Unknown')} | status={med.get('status', 'unknown')} | urgency={med.get('urgency', 'unknown')} | schedule={med.get('schedule') or med.get('time') or 'unknown'}"
                )
        if med_lines:
            lines.append("Medication List:\n" + "\n".join(med_lines))

    if assignments:
        assignment_lines = []
        for item in assignments:
            if isinstance(item, dict):
                assignment_lines.append(
                    f"- {item.get('nurse_name') or 'Unknown nurse'} | temporary={item.get('is_temporary', False)}"
                )
        if assignment_lines:
            lines.append("Assigned Nurses:\n" + "\n".join(assignment_lines))

    module_block = _format_kv_block("Module Outputs", module_outputs)
    if module_block:
        lines.append(module_block)

    lines.append("--------------------------------")
    return "\n".join(lines)


def answer(
    question: str,
    patient_context: Optional[dict] = None,
    top_k: int = 5,
) -> Tuple[str, List[str]]:
    chunks = retrieve(question, top_k=top_k)
    doc_context = "\n\n".join(chunk["text"] for chunk in chunks)
    sources = [chunk["text"][:120] + "…" for chunk in chunks]

    clinical_summary = generate_patient_summary(patient_context) if patient_context else ""

    system_msg = (
        "You are a Triage Assistant in an Emergency Department. "
        "Use the clinical context and retrieved guidelines to answer the nurse's question. "
        "Be concise, accurate, and prioritize urgency. "
        "If the patient-specific data does not contain the answer, say so clearly."
    )

    user_msg = (
        f"CLINICAL GUIDELINES:\n{doc_context}\n\n"
        f"PATIENT CONTEXT:\n{clinical_summary}\n\n"
        f"USER QUESTION: {question}\n"
        f"INSTRUCTION: Answer from the patient context first, then the retrieved clinical guidelines."
    )

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]

    reply = _call_openrouter(messages)
    if reply:
        return reply, sources

    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3")
    prompt = (
        "You are a Triage Assistant in an Emergency Department.\n"
        "Use the patient context and retrieved clinical guidelines to answer the nurse's question.\n\n"
        f"CLINICAL GUIDELINES:\n{doc_context}\n\n"
        f"PATIENT CONTEXT:\n{clinical_summary}\n\n"
        f"USER QUESTION: {question}\n"
        "INSTRUCTION: Answer from the patient context first, then the guidelines.\n"
        "ANSWER:"
    )

    try:
        response = http_requests.post(
            ollama_url,
            json={"model": ollama_model, "prompt": prompt, "stream": False},
            timeout=60,
        )
        if response.status_code == 200:
            return response.json().get("response", "No response from Ollama"), sources
    except Exception:
        pass

    return "Error: Could not connect to OpenRouter or local Ollama.", sources

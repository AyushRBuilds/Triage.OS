"""
RAG Chatbot
-----------
<<<<<<< HEAD
Combines the retriever with a generative LLM to answer
=======
Combines the retriever with a generative LLM (via OpenRouter) to answer
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
clinical questions grounded in retrieved context.

Usage:
    from ai.rag.chatbot import answer
    reply, sources = answer("What is the treatment for hypertensive crisis?")
"""
import os
<<<<<<< HEAD
from google.generativeai import GenerativeModel, configure
from ai.rag.retriever import retrieve
from typing import Tuple, List, Optional

# Load API Key from environment
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    configure(api_key=API_KEY)
=======
import requests as http_requests
from ai.rag.retriever import retrieve
from typing import Tuple, List, Optional

# ── OpenRouter config ─────────────────────────────────────────
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free")


def _call_openrouter(messages: list[dict]) -> str | None:
    """Call the OpenRouter API and return the assistant's response text."""
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

>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b

def generate_patient_summary(model_outputs: dict) -> str:
    """
    Combines outputs from multiple models into a text summary for the LLM.
    
    Expected model_outputs keys:
        - transcript: str
        - entities: list[dict]
        - urgency_level: str
        - risk_score: float
    """
    entities = model_outputs.get("entities", [])
    symptoms = [e["text"] for e in entities if e["label"] == "SYMPTOM"]
    meds = [e["text"] for e in entities if e["label"] == "DRUG"]
    
    summary = (
        f"--- PATIENT CLINICAL CONTEXT ---\n"
        f"Transcript: {model_outputs.get('transcript', 'N/A')}\n"
        f"Detected Symptoms: {', '.join(symptoms) or 'None'}\n"
        f"Detected Medications: {', '.join(meds) or 'None'}\n"
        f"Triage Urgency: {model_outputs.get('urgency_level', 'Unknown')}\n"
        f"ML Risk Score: {model_outputs.get('risk_score', 'Unknown')}\n"
        f"--------------------------------"
    )
    return summary

<<<<<<< HEAD
try:
    import requests
except ImportError:
    pass
=======
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b

def answer(
    question: str, 
    patient_context: Optional[dict] = None, 
    top_k: int = 5
) -> Tuple[str, List[str]]:
    """
    Retrieve clinical guidelines and generate a grounded answer using 
<<<<<<< HEAD
    OLLAMA (Local LLM) combined with patient model outputs.
=======
    OpenRouter LLM combined with patient model outputs.
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
    """
    # 1. Retrieve knowledge from FAISS index
    chunks = retrieve(question, top_k=top_k)
    doc_context = "\n\n".join(c["text"] for c in chunks)
    sources = [c["text"][:120] + "…" for c in chunks]

    # 2. Format clinical context from model outputs
    clinical_summary = ""
    if patient_context:
        clinical_summary = generate_patient_summary(patient_context)

<<<<<<< HEAD
    # 3. Construct Final Prompt
=======
    # 3. Construct messages for OpenRouter
    system_msg = (
        "You are a Triage Assistant in an Emergency Department. "
        "Based on Clinical Guidelines and Patient Status, answer clinical questions. "
        "Be concise and prioritize urgency."
    )

    user_msg = (
        f"CLINICAL GUIDELINES:\n{doc_context}\n\n"
        f"{clinical_summary}\n\n"
        f"USER QUESTION: {question}\n"
        f"INSTRUCTION: Be concise and prioritize urgency."
    )

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]

    # 4. Try OpenRouter
    reply = _call_openrouter(messages)
    if reply:
        return reply, sources

    # 5. Fallback: try local Ollama
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3")

>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
    prompt = (
        f"You are a Triage Assistant in an Emergency Department.\n"
        f"Based on the following Clinical Guidelines and Patient Status, answer the clinical question.\n\n"
        f"CLINICAL GUIDELINES:\n{doc_context}\n\n"
        f"{clinical_summary}\n\n"
        f"USER QUESTION: {question}\n"
        f"INSTRUCTION: Be concise and prioritize urgency.\n"
        f"ANSWER:"
    )

<<<<<<< HEAD
    # 4. Call LLM (Ollama or Gemini)
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3")
    
    # Try Ollama first
    try:
        response = requests.post(
=======
    try:
        response = http_requests.post(
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            },
            timeout=5
        )
        if response.status_code == 200:
            return response.json().get("response", "No response from Ollama"), sources
    except Exception:
        pass

<<<<<<< HEAD
    # Fallback to Gemini if available
    if API_KEY:
        try:
            model = GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return response.text, sources
        except Exception as e:
            return f"Error: Both Ollama and Gemini failed. {str(e)}", sources

    return "Error: Could not connect to local Ollama and no Gemini API key found.", sources


=======
    return "Error: Could not connect to OpenRouter or local Ollama.", sources
>>>>>>> 6b21ab91cf2faf394c7cdbc3ccc0ad575b12609b

"""
RAG Chatbot
-----------
Combines the retriever with a generative LLM to answer
clinical questions grounded in retrieved context.

Usage:
    from ai.rag.chatbot import answer
    reply, sources = answer("What is the treatment for hypertensive crisis?")
"""
import os
from google.generativeai import GenerativeModel, configure
from ai.rag.retriever import retrieve
from typing import Tuple, List, Optional

# Load API Key from environment
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    configure(api_key=API_KEY)

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

try:
    import requests
except ImportError:
    pass

def answer(
    question: str, 
    patient_context: Optional[dict] = None, 
    top_k: int = 5
) -> Tuple[str, List[str]]:
    """
    Retrieve clinical guidelines and generate a grounded answer using 
    OLLAMA (Local LLM) combined with patient model outputs.
    """
    # 1. Retrieve knowledge from FAISS index
    chunks = retrieve(question, top_k=top_k)
    doc_context = "\n\n".join(c["text"] for c in chunks)
    sources = [c["text"][:120] + "…" for c in chunks]

    # 2. Format clinical context from model outputs
    clinical_summary = ""
    if patient_context:
        clinical_summary = generate_patient_summary(patient_context)

    # 3. Construct Final Prompt
    prompt = (
        f"You are a Triage Assistant in an Emergency Department.\n"
        f"Based on the following Clinical Guidelines and Patient Status, answer the clinical question.\n\n"
        f"CLINICAL GUIDELINES:\n{doc_context}\n\n"
        f"{clinical_summary}\n\n"
        f"USER QUESTION: {question}\n"
        f"INSTRUCTION: Be concise and prioritize urgency.\n"
        f"ANSWER:"
    )

    # 4. Call LLM (Ollama or Gemini)
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3")
    
    # Try Ollama first
    try:
        response = requests.post(
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

    # Fallback to Gemini if available
    if API_KEY:
        try:
            model = GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return response.text, sources
        except Exception as e:
            return f"Error: Both Ollama and Gemini failed. {str(e)}", sources

    return "Error: Could not connect to local Ollama and no Gemini API key found.", sources



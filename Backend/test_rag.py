"""Quick RAG test — run from Backend/ directory"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

# Load .env
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

print("=== STEP 1: Check environment ===")
api_key = os.getenv("OPENROUTER_API_KEY", "")
model   = os.getenv("OPENROUTER_MODEL", "")
print(f"  OPENROUTER_API_KEY set: {bool(api_key)} ({api_key[:12]}...)" if api_key else "  OPENROUTER_API_KEY: NOT SET")
print(f"  OPENROUTER_MODEL: {model}")

print("\n=== STEP 2: Test Retriever (FAISS) ===")
from ai.rag.retriever import retrieve
results = retrieve("what are signs of chest pain?", top_k=3)
if results:
    print(f"  Retrieved {len(results)} chunks:")
    for i, r in enumerate(results, 1):
        print(f"  [{i}] score={r['score']:.4f} | {r['text'][:120]}...")
else:
    print("  NO results — FAISS index may be empty or missing")

print("\n=== STEP 3: Test Full RAG (Retriever + OpenRouter LLM) ===")
from ai.rag.chatbot import answer
reply, sources = answer(
    question="What is the emergency management for a patient with severe chest pain?",
    patient_context={
        "transcript": "Patient has crushing chest pain radiating to left arm for 30 minutes.",
        "entities": [{"text": "chest pain", "label": "SYMPTOM"}, {"text": "aspirin", "label": "DRUG"}],
        "urgency_level": "CRITICAL",
        "risk_score": 0.91,
    }
)
print(f"  REPLY:\n{reply}")
print(f"\n  SOURCES ({len(sources)}):")
for s in sources:
    print(f"  - {s}")

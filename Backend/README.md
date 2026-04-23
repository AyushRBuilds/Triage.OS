# Triage.OS — Backend

FastAPI backend + AI pipeline for the Triage.OS emergency department system.

## Structure

```
Backend/
├── main.py              ← FastAPI app entry point
├── database.py          ← SQLAlchemy engine & session
├── models.py            ← ORM models (Patient, Vital, SOAPNote)
├── requirements.txt
├── .env.example         ← copy to .env and fill in secrets
│
├── routes/
│   ├── patients.py      ← CRUD for patients
│   ├── vitals.py        ← record & fetch vitals
│   ├── kanban.py        ← Kanban board (get board, move patient)
│   ├── soap.py          ← SOAP note creation & retrieval
│   └── chat.py          ← RAG chatbot endpoint
│
└── ai/
    ├── soap_pipeline.py          ← NER + Classifier → SOAP note
    ├── vitals_simulator.py       ← synthetic vitals for testing
    ├── risk_scorer.py            ← convenience re-export
    │
    ├── ner_model/
    │   └── medical_ner_model.zip ← unzip here
    │
    ├── urgency_classifier/
    │   └── urgency_classifier.zip ← unzip here
    │
    ├── risk_scorer/
    │   ├── risk_scorer_model.pkl
    │   └── risk_scorer_explainer.pkl
    │
    └── rag/
        ├── indexer.py    ← build FAISS index from docs
        ├── retriever.py  ← top-k chunk retrieval
        └── chatbot.py    ← LLM answer generation
```

## Setup

```bash
# 1. Create & activate virtualenv
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env file
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux

# 4. Unzip AI models
#    → Extract medical_ner_model.zip  into  ai/ner_model/
#    → Extract urgency_classifier.zip into  ai/urgency_classifier/

# 5. Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Docs

Visit **http://localhost:8000/docs** for the interactive Swagger UI once running.

| Prefix       | Description              |
|-------------|--------------------------|
| `/patients` | Patient CRUD             |
| `/vitals`   | Vitals recording         |
| `/kanban`   | Kanban board management  |
| `/soap`     | SOAP note pipeline       |
| `/chat`     | RAG chatbot (Day 3)      |

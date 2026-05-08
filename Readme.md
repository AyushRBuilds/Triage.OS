# Triage.OS - Advanced Clinical Intelligence & Ward Management

Triage.OS is a next-generation healthcare operating system designed to bridge the gap between high-volume clinical data and actionable insights. By integrating high-fidelity vital sign simulation with Large Language Models (LLMs), it reduces administrative burden and enhances patient safety through automated documentation and real-time monitoring.

## 🎯 Problem Statement & Core Ideas
In modern clinical settings, healthcare professionals are overwhelmed by:
*   **Documentation Tax:** Spending excessive time on manual SOAP note entry.
*   **Data Fragmentation:** Difficulty in synthesizing real-time vitals with patient history.
*   **Cognitive Overload:** Managing high-occupancy wards with varying patient urgency.

**Triage.OS solves this by:**
1.  **AI-Driven Synthesis:** Automating the conversion of unstructured clinical observations into structured medical records.
2.  **Predictive Triage:** Using Machine Learning to identify deteriorating patients before they reach a critical state.
3.  **Unified Control Plane:** Providing a centralized, role-based interface for the entire clinical team.

## 🚀 Key Features

### 1. AI-Powered Clinical Pipeline (SOAP.AI)
- **Medical NER (Named Entity Recognition):** Automatically extracts clinical entities (Symptoms, Drugs, Measurements, Conditions) from raw medical notes using specialized Transformer models.
- **Automated SOAP Documentation:** Transforms unstructured clinical text into structured **S**ubjective, **O**bjective, **A**ssessment, and **P**lan (SOAP) formats using LLMs (via OpenRouter).
- **Clinical Urgency Classification:** Heuristic and ML-based classification of patient urgency levels to prioritize care.
- **Risk Scoring:** Predictive mortality and deterioration risk scoring based on vitals and historical data (XGBoost/Shap).

### 2. Real-Time Patient Monitoring
- **Vitals Simulator:** Background processes simulate heart rate, SpO2, blood pressure, and temperature for testing and training.
- **Dynamic Dashboards:** Real-time visualization of patient vitals using Recharts with instant history tracking.
- **Alert System:** Instant notifications for critical vital sign deviations or high-risk scores.

### 3. Ward Management
- **Clinical Kanban Board:** Drag-and-drop interface for managing patient flow (Waiting → In Progress → Done) using `@hello-pangea/dnd`.
- **Role-Based Access:** Specialized dashboards for **Doctors**, **Nurses**, and **Administrators** with tailored metric views.
- **Shift Management:** Dedicated panels for nurse shift swaps, schedule tracking, and ward-wide announcements.
- **Ward Overview:** High-level visualization of bed occupancy, patient distribution, and active clinical alerts.

### 4. Intel-Assisted Chat (RAG)
- **Clinical Knowledge Base:** Searchable medical documentation indexed using FAISS for lightning-fast retrieval.
- **RAG Chatbot:** Conversational AI that answers clinical queries based on the internal knowledge base to assist in clinical decision making.

---

## 🛠 Tech Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (Supabase) & SQLite (Local testing)
- **ORM:** SQLAlchemy
- **AI/ML Libraries:** `transformers`, `torch`, `spacy`, `scikit-learn`, `xgboost`, `faiss-cpu`, `sentence-transformers`
- **LLM Integration:** OpenRouter (NVIDIA Nemotron, etc.)

### Frontend
- **Framework:** React 19 (Vite)
- **State Management:** React Context API
- **UI Components:** Modern CSS & Lucide-React Icons
- **Charts:** Recharts
- **Drag-and-Drop:** Hello Pangea DnD

### Infrastructure
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Real-time subscriptions
- **Storage:** Supabase Storage (for clinical documents)

---

## 📂 Project Structure

```text
Triage.OS/
├── Backend/                # FastAPI Application
│   ├── ai/                 # Core AI Models (NER, Risk Scorer, SOAP Pipeline)
│   │   ├── rag/            # Retrieval Augmented Generation system
│   │   ├── ner_model/      # Medical NER implementation
│   │   └── vitals_simulator.py # Background vitals generation
│   ├── routes/             # API Endpoints (Chat, Patients, SOAP, Vitals, Kanban)
│   ├── models.py           # SQLAlchemy Database Models
│   └── main.py             # Server Entry Point
├── frontend/               # React (Vite) Application
│   ├── src/
│   │   ├── api/            # Supabase & API Service Layer
│   │   ├── components/     # UI Components (Kanban, Dashboards, SOAP View)
│   │   ├── contexts/       # Auth & Notification Contexts
│   │   └── hooks/          # Custom Hooks (Vitals simulation)
├── supabase/               # SQL Migrations and Seeding
└── SETUP_INSTRUCTIONS.txt  # Comprehensive model setup guide
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase Account (for live data features)

### Backend Setup
1. **Model Extraction:**
   Extract `triage_models.zip` into `Backend/ai/`. Ensure the path exists: `Backend/ai/ner_model/...`
2. **Environment Variables:**
   Create a `.env` in `Backend/`:
   ```env
   OPENROUTER_API_KEY=your_key
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
   DATABASE_URL=sqlite:///./triage.db
   ```
3. **Install Dependencies:**
   ```bash
   cd Backend
   pip install -r requirements.txt
   ```
4. **Run Server:**
   ```bash
   python main.py
   ```

### Frontend Setup
1. **Install Packages:**
   ```bash
   cd frontend
   npm install
   ```
2. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## 🧠 Clinical Workflow Breakdown

1. **Patient Intake:** Patient is added to the system via the `Patients` route.
2. **Triage:** Nurse enters raw clinical notes. The **SOAP Pipeline** extracts entities and suggests a SOAP note and urgency level.
3. **Monitoring:** **Vitals Simulator** generates live data; **Risk Scorer** calculates deterioration probability.
4. **Coordination:** Doctors use the **Kanban Board** to move patients through treatment phases.
5. **Retrieval:** Clinicians use the **RAG Chat** to verify treatment protocols against the knowledge base.

---

## 📄 License
Internal use only. Part of the Hello project suite.


import logging
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routes import patients, vitals, kanban, soap, chat
from contextlib import asynccontextmanager
import threading

# Configure root logger so all modules (including vitals_simulator) output to console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-24s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Create DB tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Start background tasks on startup ──
    try:
        import vitals_simulator
        logger.info("🫀 Launching Vitals Simulator as background thread...")
        simulator_thread = threading.Thread(
            target=vitals_simulator.simulate,
            name="VitalsSimulator",
            daemon=True,
        )
        simulator_thread.start()
    except Exception as e:
        logger.warning("⚠️  Vitals Simulator could not start: %s", e)

    logger.info("✅ Triage.OS backend is fully operational.")
    yield
    logger.info("🛑 Shutting down Triage.OS backend...")

app = FastAPI(title="Triage.OS API", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(patients.router, prefix="/patients", tags=["Patients"])
app.include_router(vitals.router,   prefix="/vitals",   tags=["Vitals"])
app.include_router(kanban.router,   prefix="/kanban",   tags=["Kanban"])
app.include_router(soap.router,     prefix="/soap",     tags=["SOAP"])
app.include_router(chat.router,     prefix="/chat",     tags=["Chat"])

@app.get("/")
def root():
    return {"status": "Triage.OS backend running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

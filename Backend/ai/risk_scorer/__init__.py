"""
Risk Scorer
-----------
Loads risk_scorer_model.pkl  (XGBoost / sklearn pipeline)
and risk_scorer_explainer.pkl (SHAP TreeExplainer / LIME explainer)
to predict patient risk scores and explain predictions.
"""
import pickle
from pathlib import Path

MODEL_DIR = Path(__file__).parent

_model = None
_explainer = None


def _load():
    global _model, _explainer
    if _model is None:
        with open(MODEL_DIR / "risk_scorer_model.pkl", "rb") as f:
            _model = pickle.load(f)
    if _explainer is None:
        with open(MODEL_DIR / "risk_scorer_explainer.pkl", "rb") as f:
            _explainer = pickle.load(f)


def predict(features: dict) -> float:
    """
    Predict risk score (0-1) from a dict of vital-sign features.
    Expected keys: heart_rate, spo2, blood_pressure_sys, blood_pressure_dia, temperature
    """
    _load()
    import pandas as pd
    df = pd.DataFrame([features])
    score = float(_model.predict_proba(df)[0][1])
    return round(score, 4)


def explain(features: dict) -> dict:
    """Return SHAP / LIME explanation values for a prediction."""
    _load()
    import pandas as pd
    df = pd.DataFrame([features])
    shap_values = _explainer.shap_values(df)
    return {"shap_values": shap_values[0].tolist()}

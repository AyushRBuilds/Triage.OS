"""
Medical NER Model
-----------------
Loads the spaCy-based medical NER model from the extracted folder
and exposes an `extract(text)` function that returns named entities.

Model path: ai/ner_model/medical_ner_model/
"""
from pathlib import Path
import spacy

MODEL_PATH = Path(__file__).parent / "medical_ner_model"

_nlp = None


def _load():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load(str(MODEL_PATH))


def extract(text: str) -> list[dict]:
    """
    Run NER on clinical text.

    Returns:
        List of entities: [{"text": str, "label": str, "start": int, "end": int}, ...]
    """
    _load()
    doc = _nlp(text)
    return [
        {
            "text":  ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end":   ent.end_char,
        }
        for ent in doc.ents
    ]


"""
Urgency Classifier
------------------
Loads the HuggingFace BERT-based urgency classifier from the
extracted folder and exposes a `classify(text)` function.

Model path: ai/urgency_classifier/urgency_classifier/
  Files: config.json, model.safetensors, tokenizer.json,
         tokenizer_config.json, training_args.bin
"""
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_PATH = Path(__file__).parent / "urgency_classifier"

_tokenizer = None
_model = None

# Label map — adjust if your model uses different labels
LABEL_MAP = {0: "low", 1: "medium", 2: "high", 3: "critical"}


def _load():
    global _tokenizer, _model
    if _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained(str(MODEL_PATH))
    if _model is None:
        _model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_PATH))
        _model.eval()


def classify(text: str) -> dict:
    """
    Classify the urgency level of a clinical text snippet.

    Returns:
        {
            "label":      str,   # e.g. "high"
            "confidence": float, # 0-1
            "scores":     dict,  # {label: score, ...}
        }
    """
    _load()
    inputs = _tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        logits = _model(**inputs).logits
    probs = torch.softmax(logits, dim=-1)[0].tolist()

    id2label = getattr(_model.config, "id2label", LABEL_MAP)
    scores = {id2label[i]: round(p, 4) for i, p in enumerate(probs)}
    best_idx = int(torch.argmax(logits, dim=-1).item())

    return {
        "label":      id2label[best_idx],
        "confidence": round(probs[best_idx], 4),
        "scores":     scores,
    }


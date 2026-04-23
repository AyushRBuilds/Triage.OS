"""
RAG Retriever
-------------
Given a query string, retrieves the top-k relevant document chunks
from the FAISS index built by indexer.py.

Usage:
    from ai.rag.retriever import retrieve
    results = retrieve("what are signs of sepsis?", top_k=3)
"""
from pathlib import Path
from typing import List, Dict

INDEX_PATH = Path(__file__).parent / "faiss_index"

import pickle

try:
    import faiss
except Exception:
    faiss = None

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

_model = None
_index = None
_texts = None

def _load_resources():
    global _model, _index, _texts
    if faiss is None or SentenceTransformer is None:
        return

    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    if _index is None:
        if (INDEX_PATH / "docs.index").exists():
            _index = faiss.read_index(str(INDEX_PATH / "docs.index"))
        else:
            print("Warning: FAISS index not found. Run indexer.py first.")
    if _texts is None:
        if (INDEX_PATH / "docs.pkl").exists():
            with open(INDEX_PATH / "docs.pkl", "rb") as f:
                _texts = pickle.load(f)


def retrieve(query: str, top_k: int = 5) -> List[Dict]:
    """
    Embed the query and search the FAISS index.

    Returns:
        List of dicts: [{"text": str, "score": float}, ...]
    """
    _load_resources()

    if faiss is None or SentenceTransformer is None:
        return []

    if _index is None or _texts is None:
        return []

    # Embed query
    query_vector = _model.encode([query]).astype('float32')
    
    # Search index
    distances, indices = _index.search(query_vector, top_k)
    
    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < len(_texts):
            results.append({
                "text": _texts[idx],
                "score": float(dist)
            })
    
    return results

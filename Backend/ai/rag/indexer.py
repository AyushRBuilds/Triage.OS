"""
RAG Indexer
-----------
Reads medical documents / guidelines and builds a vector index
using FAISS + HuggingFace sentence-transformers.

Usage:
    python -m ai.rag.indexer --docs_dir ./data/docs
"""
from pathlib import Path
from typing import List

DOCS_DIR = Path(__file__).parent / "data" / "docs"
INDEX_PATH = Path(__file__).parent / "faiss_index"


def load_documents(docs_dir: Path = DOCS_DIR) -> List[str]:
    """Load raw text from .txt / .pdf files in docs_dir."""
    texts = []
    for f in docs_dir.glob("**/*.txt"):
        texts.append(f.read_text(encoding="utf-8"))
    # TODO: add PDF loader (pdfplumber / pypdf2)
    return texts


import faiss
import numpy as np
import pickle
from sentence_transformers import SentenceTransformer

def build_index(texts: List[str]):
    """
    Embed documents and store in a FAISS index.
    """
    if not texts:
        print("No documents to index.")
        return

    print(f"Loading embedding model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print(f"Generating embeddings for {len(texts)} chunks...")
    # For larger docs, we'd chunk them first. Here we assume texts are already chunks or short docs.
    embeddings = model.encode(texts)
    
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings.astype('float32'))
    
    # Create directory if it doesn't exist
    INDEX_PATH.mkdir(parents=True, exist_ok=True)
    
    # Save FAISS index
    faiss.write_index(index, str(INDEX_PATH / "docs.index"))
    
    # Save the original texts so we can retrieve them by index
    with open(INDEX_PATH / "docs.pkl", "wb") as f:
        pickle.dump(texts, f)

    print(f"Index and documents saved to {INDEX_PATH}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--docs_dir", type=str, default=str(DOCS_DIR))
    args = parser.parse_args()
    
    if not Path(args.docs_dir).exists():
        print(f"Directory {args.docs_dir} does not exist. Creating it.")
        Path(args.docs_dir).mkdir(parents=True, exist_ok=True)
        # Create a dummy file if empty
        (Path(args.docs_dir) / "sample_guideline.txt").write_text(
            "Sepsis is a life-threatening organ dysfunction caused by a dysregulated host response to infection. "
            "Signs include high heart rate, low blood pressure, and confusion. "
            "Treatment involves immediate antibiotics and fluid resuscitation."
        )

    docs = load_documents(Path(args.docs_dir))
    print(f"Loaded {len(docs)} documents")
    build_index(docs)

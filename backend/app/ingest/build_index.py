"""Build the search index end-to-end.

    python -m app.ingest.build_index            # use .env settings
    python -m app.ingest.build_index --backend hash   # quick, no model download

Pipeline:  WP REST  ->  clean docs  ->  chunks  ->  embeddings  ->  IndexStore
"""
from __future__ import annotations

import argparse
import time
from datetime import datetime, timezone

import numpy as np

from app.config import settings
from app.ingest.clean import to_documents
from app.ingest.chunk import chunk_documents
from app.ingest.wp_client import fetch_all
from app.retrieval.embeddings import get_embedder
from app.retrieval.store import IndexStore


def build(backend: str | None = None) -> IndexStore:
    if backend:
        settings.embedding_backend = backend

    t0 = time.time()
    print(f"[1/4] Fetching from {settings.wp_base_url} ...")
    raw = fetch_all(settings.wp_base_url, settings.wp_api_path, settings.post_type_list)

    print(f"[2/4] Cleaning {len(raw)} items ...")
    docs = to_documents(raw)
    cats = sorted({d.category for d in docs})
    print(f"      {len(docs)} documents across {len(cats)} categories: {cats}")

    print("[3/4] Chunking ...")
    chunks = chunk_documents(docs)
    print(f"      {len(chunks)} chunks")

    print(f"[4/4] Embedding with backend='{settings.embedding_backend}' ...")
    embedder = get_embedder(settings)
    vectors = embedder.encode([c["text"] for c in chunks])
    print(f"      vectors: {vectors.shape}")

    meta = {
        "built_at": datetime.now(timezone.utc).isoformat(),
        "source": settings.wp_base_url,
        "embedding_backend": embedder.name,
        "embedding_model": getattr(embedder, "model_name", embedder.name),
        "dim": int(vectors.shape[1]),
        "doc_count": len(docs),
        "chunk_count": len(chunks),
        "categories": cats,
    }
    store = IndexStore(chunks, np.asarray(vectors, dtype=np.float32), meta)
    store.save(settings.index_path)
    print(f"\n✓ Saved index to {settings.index_path}  ({time.time() - t0:.1f}s)")
    return store


def main() -> None:
    ap = argparse.ArgumentParser(description="Build the AI search index")
    ap.add_argument("--backend", help="override embedding_backend (bge-m3|openai|hash)")
    build(ap.parse_args().backend)


if __name__ == "__main__":
    main()

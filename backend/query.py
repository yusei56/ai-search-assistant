"""Smoke-test the index from the command line.

    python query.py "ginseng quality testing"
    python query.py "冬虫夏草" --category "Knowledge Center"
"""
from __future__ import annotations

import argparse

from app.config import settings
from app.retrieval.embeddings import get_embedder
from app.retrieval.search import HybridSearcher
from app.retrieval.store import IndexStore


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--category", default=None)
    ap.add_argument("-k", "--limit", type=int, default=5)
    args = ap.parse_args()

    store = IndexStore.load(settings.index_path)
    settings.embedding_backend = store.meta.get(
        "embedding_backend", settings.embedding_backend
    )
    settings.embedding_model = store.meta.get(
        "embedding_model", settings.embedding_model
    )
    searcher = HybridSearcher(store, get_embedder(settings))
    resp = searcher.search(args.query, category=args.category, limit=args.limit)

    print(f"\nQuery: {resp.query!r}   total={resp.total}")
    print(f"Facets: {resp.facets}\n")
    for i, r in enumerate(resp.results, 1):
        print(f"{i}. [{r.score:.4f}] {r.title}  ({r.category})")
        print(f"   {r.url}")
        print(f"   {r.snippet}\n")


if __name__ == "__main__":
    main()

"""FastAPI entrypoint.

    uvicorn app.main:app --reload --port 8000

On startup it loads the prebuilt index and an embedder whose backend matches
the one the index was built with (so query and document vectors are aligned).
The app still boots if the index is missing — endpoints return a clear 503.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.retrieval.embeddings import get_embedder
from app.retrieval.search import HybridSearcher
from app.retrieval.store import IndexStore

log = logging.getLogger("ai-search")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.searcher = None
    try:
        store = IndexStore.load(settings.index_path)
        # Align query embedder with the backend the index was built with.
        built_backend = store.meta.get("embedding_backend", settings.embedding_backend)
        settings.embedding_backend = built_backend
        # Use the exact model the index was built with (avoids dim mismatch /
        # re-downloading a different model on load).
        settings.embedding_model = store.meta.get("embedding_model", settings.embedding_model)
        embedder = get_embedder(settings)
        app.state.searcher = HybridSearcher(store, embedder)
        log.info(
            "Index loaded: %s docs / %s chunks (backend=%s, dim=%s)",
            store.meta.get("doc_count"), store.meta.get("chunk_count"),
            built_backend, store.meta.get("dim"),
        )
    except FileNotFoundError as exc:
        log.warning("No index loaded — %s", exc)
    except Exception as exc:  # don't crash the server on a bad index/model
        log.error("Failed to load index/embedder: %s", exc)
    yield


app = FastAPI(title="AI Search Assistant", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"name": "AI Search Assistant API", "docs": "/docs", "health": "/api/health"}

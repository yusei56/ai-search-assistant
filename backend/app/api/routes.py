"""HTTP API.

GET /api/health              liveness + index status
GET /api/meta               index metadata (categories, counts, backend)
GET /api/search             ranked result cards + facets (JSON)
GET /api/suggest            lightweight title autosuggest
GET /api/overview           streaming AI overview (Server-Sent Events)
"""
from __future__ import annotations

import json

from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.llm.overview import stream_overview
from app.retrieval.search import HybridSearcher

router = APIRouter(prefix="/api")


def _searcher(request: Request) -> HybridSearcher | None:
    return getattr(request.app.state, "searcher", None)


@router.get("/health")
def health(request: Request):
    s = _searcher(request)
    return {"status": "ok", "index_loaded": s is not None}


@router.get("/meta")
def meta(request: Request):
    s = _searcher(request)
    if s is None:
        return JSONResponse({"error": "index not loaded"}, status_code=503)
    return s.store.meta


@router.get("/search")
def search(
    request: Request,
    q: str = Query(..., min_length=1),
    category: str | None = None,
    offset: int = 0,
    limit: int = Query(default=0),
):
    s = _searcher(request)
    if s is None:
        return JSONResponse(
            {"error": "Index not built. Run: python -m app.ingest.build_index"},
            status_code=503,
        )
    resp = s.search(
        q, category=category, offset=offset,
        limit=limit or settings.page_size,
    )
    return {
        "query": resp.query,
        "total": resp.total,
        "results": [r.as_dict() for r in resp.results],
        "facets": resp.facets,
    }


@router.get("/suggest")
def suggest(request: Request, q: str = Query(..., min_length=1), limit: int = 6):
    s = _searcher(request)
    if s is None:
        return {"suggestions": []}
    ql = q.lower()
    seen, out = set(), []
    for c in s.store.chunks:
        title = c["title"]
        if title not in seen and ql in title.lower():
            seen.add(title)
            out.append(title)
        if len(out) >= limit:
            break
    return {"suggestions": out}


@router.get("/overview")
async def overview(request: Request, q: str = Query(..., min_length=1)):
    """Stream the AI overview as SSE. Sends the source list first, then deltas."""
    s = _searcher(request)

    async def event_gen():
        if s is None:
            yield {"event": "error", "data": "index not loaded"}
            return
        resp = s.search(q, limit=settings.page_size)
        # emit sources up-front so the UI can render citations
        yield {"event": "sources", "data": json.dumps(resp.contexts, ensure_ascii=False)}
        for delta in stream_overview(q, resp.contexts):
            if await request.is_disconnected():
                break
            # JSON-encode so SSE preserves leading spaces / newlines verbatim.
            yield {"event": "delta", "data": json.dumps(delta, ensure_ascii=False)}
        yield {"event": "done", "data": ""}

    return EventSourceResponse(event_gen())

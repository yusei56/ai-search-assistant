# Backend — AI Search API

FastAPI service: WordPress ingestion → hybrid retrieval → streaming AI overview.

## Setup

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # configure source site, embeddings, LLM
```

## Build the index

```bash
python -m app.ingest.build_index            # default backend (bge-m3)
python -m app.ingest.build_index --backend hash   # no model download
```

Artifacts land in `data/index/` (`chunks.json`, `embeddings.npy`, `meta.json`).

## Run

```bash
uvicorn app.main:app --reload --port 8000   # /docs for Swagger UI
```

## Smoke test

```bash
python query.py "ginseng quality testing"
python query.py "fingerprint analysis" --category "Quality Testing of Herbal Medicines"
```

## Pipeline

| Stage      | Module                       | Notes                                            |
| ---------- | ---------------------------- | ------------------------------------------------ |
| Fetch      | `ingest/wp_client.py`        | WP REST `/pages`,`/posts`, paged                 |
| Clean      | `ingest/clean.py`            | strip HTML, derive category from page hierarchy  |
| Chunk      | `ingest/chunk.py`            | ~1100-char paragraph packing w/ overlap          |
| Embed      | `retrieval/embeddings.py`    | `bge-m3` \| `openai` \| `hash` (pluggable)       |
| Store      | `retrieval/store.py`         | numpy vectors + lazy BM25 (jieba tokenizer)      |
| Search     | `retrieval/search.py`        | dense + BM25 fused via RRF, 1 card per doc       |
| Overview   | `llm/overview.py`            | OpenAI-compatible, streamed, citation-constrained|

## Configuration

All via env / `.env` — see `.env.example`. Key knobs:

- `EMBEDDING_BACKEND` — `bge-m3` (default) / `openai` / `hash`
- `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` — OpenAI-compatible chat endpoint
- `WP_BASE_URL`, `WP_POST_TYPES` — source site
- `PAGE_SIZE`, `TOP_K`, `CORS_ORIGINS`

The server boots even without an index (endpoints return a clear 503) and the
query embedder is auto-aligned to the backend the index was built with.

"""Hybrid retrieval: dense (vector) + sparse (BM25) fused with RRF.

Returns one result card per source document (best matching chunk wins), plus
category facet counts for the filter UI - mirroring the example site's layout.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

import numpy as np

from .embeddings import BaseEmbedder
from .store import IndexStore, tokenize


_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does",
    "for", "from", "how", "i", "in", "is", "it", "me", "of", "on", "or",
    "our", "the", "to", "we", "what", "with", "you", "your",
}
_SEMANTIC_FLOOR = 0.62


@dataclass
class SearchResult:
    doc_id: str
    title: str
    url: str
    category: str
    subcategory: str
    type: str
    thumbnail: str | None
    snippet: str
    score: float

    def as_dict(self) -> dict:
        return self.__dict__


@dataclass
class SearchResponse:
    query: str
    total: int
    results: list[SearchResult]
    facets: dict[str, int] = field(default_factory=dict)
    contexts: list[dict] = field(default_factory=list)  # for the LLM overview


def _query_terms(query: str) -> list[str]:
    return [
        token for token in tokenize(query)
        if len(token) > 1 and token not in _STOPWORDS
    ]


def _rrf(rank_lists: list[list[int]], k: int) -> dict[int, float]:
    scores: dict[int, float] = {}
    for ranks in rank_lists:
        for rank, idx in enumerate(ranks):
            scores[idx] = scores.get(idx, 0.0) + 1.0 / (k + rank + 1)
    return scores


def _snippet(body: str, query_terms: set[str], width: int = 240) -> str:
    """Pick the passage around the first query-term hit; else the head."""
    low = body.lower()
    hit = -1
    for term in query_terms:
        pos = low.find(term)
        if pos != -1 and (hit == -1 or pos < hit):
            hit = pos
    if hit == -1:
        snip = body[:width]
    else:
        start = max(0, hit - width // 3)
        snip = body[start : start + width]
        if start > 0:
            snip = "... " + snip
    snip = re.sub(r"\s+", " ", snip).strip()
    return snip + ("..." if len(body) > len(snip) else "")


class HybridSearcher:
    def __init__(self, store: IndexStore, embedder: BaseEmbedder):
        self.store = store
        self.embedder = embedder
        self._query_vectors: dict[str, np.ndarray] = {}

    def _query_vector(self, query: str) -> np.ndarray:
        key = query.strip().lower()
        cached = self._query_vectors.get(key)
        if cached is not None:
            return cached
        vector = self.embedder.encode([query])[0]
        if len(self._query_vectors) >= 128:
            self._query_vectors.clear()
        self._query_vectors[key] = vector
        return vector

    def search(
        self,
        query: str,
        *,
        category: str | None = None,
        offset: int = 0,
        limit: int = 10,
        pool: int = 60,
    ) -> SearchResponse:
        chunks = self.store.chunks
        q_tokens = _query_terms(query)
        if not query.strip() or not q_tokens or not chunks:
            return SearchResponse(query=query, total=0, results=[])

        # --- dense ---
        qvec = self._query_vector(query)
        dense_scores = self.store.embeddings @ qvec
        max_dense = float(np.max(dense_scores)) if len(dense_scores) else 0.0

        # --- sparse (BM25) ---
        bm_scores = self.store.bm25.get_scores(q_tokens)
        chunk_tokens = self.store._tokens or [tokenize(c["text"]) for c in chunks]
        exact_hits = np.array(
            [any(term in tokens for term in q_tokens) for tokens in chunk_tokens],
            dtype=bool,
        )

        # BGE can assign moderate cosine scores to nonsense strings. Keep exact
        # lexical hits, and allow dense-only candidates only when the semantic
        # signal is strong enough to be plausible.
        if not bool(exact_hits.any()):
            if max_dense < _SEMANTIC_FLOOR:
                return SearchResponse(query=query, total=0, results=[])
            candidate_mask = dense_scores >= max(_SEMANTIC_FLOOR, max_dense - 0.04)
        else:
            semantic_cutoff = max(_SEMANTIC_FLOOR, max_dense - 0.12)
            candidate_mask = exact_hits | (dense_scores >= semantic_cutoff)

        candidate_idx = np.flatnonzero(candidate_mask)
        if len(candidate_idx) == 0:
            return SearchResponse(query=query, total=0, results=[])

        dense_rank = [
            int(idx)
            for idx in candidate_idx[np.argsort(-dense_scores[candidate_idx])[:pool]]
        ]
        sparse_candidates = candidate_idx[bm_scores[candidate_idx] > 0]
        sparse_rank = [
            int(idx)
            for idx in sparse_candidates[
                np.argsort(-bm_scores[sparse_candidates])[:pool]
            ]
        ]

        # --- fuse ---
        fused = _rrf([dense_rank, sparse_rank], k=60)

        # collapse to best chunk per document
        best: dict[str, tuple[int, float]] = {}
        for idx, score in fused.items():
            doc_id = chunks[idx]["doc_id"]
            if doc_id not in best or score > best[doc_id][1]:
                best[doc_id] = (idx, score)

        ranked = sorted(best.values(), key=lambda t: -t[1])

        # facets over the full ranked set (before pagination / filtering)
        facets: dict[str, int] = {}
        for idx, _ in ranked:
            cat = chunks[idx]["category"]
            facets[cat] = facets.get(cat, 0) + 1

        if category:
            ranked = [(i, s) for i, s in ranked if chunks[i]["category"] == category]

        total = len(ranked)
        q_terms = set(q_tokens) | {query.lower()}

        results: list[SearchResult] = []
        for idx, score in ranked[offset : offset + limit]:
            c = chunks[idx]
            results.append(
                SearchResult(
                    doc_id=c["doc_id"], title=c["title"], url=c["url"],
                    category=c["category"], subcategory=c.get("subcategory", ""),
                    type=c.get("type", "page"), thumbnail=c.get("thumbnail"),
                    snippet=_snippet(c.get("body", c["text"]), q_terms),
                    score=round(float(score), 5),
                )
            )

        # top contexts for the LLM overview (always from the filtered top)
        contexts = [
            {
                "n": i + 1,
                "title": chunks[idx]["title"],
                "url": chunks[idx]["url"],
                "text": chunks[idx].get("body", chunks[idx]["text"])[:800],
            }
            for i, (idx, _) in enumerate(ranked[: min(8, len(ranked))])
        ]

        return SearchResponse(
            query=query, total=total, results=results, facets=facets, contexts=contexts
        )

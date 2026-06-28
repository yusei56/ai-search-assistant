"""On-disk index: chunk metadata + dense vectors + lazily-built BM25.

Small corpus (hundreds of chunks) ⇒ brute-force numpy cosine is plenty fast and
avoids a fragile native vector-DB dependency. BM25 is rebuilt from stored tokens
on load (cheap), so we only persist text + the dense matrix.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import jieba
import numpy as np
from rank_bm25 import BM25Okapi

jieba.setLogLevel(20)  # silence jieba's loader chatter

_LATIN = re.compile(r"[a-z0-9]+")
_CJK = re.compile(r"[一-鿿]")


def tokenize(text: str) -> list[str]:
    """Mixed EN/CN tokenizer: jieba for CJK, regex words for latin."""
    text = text.lower()
    tokens: list[str] = []
    for tok in jieba.lcut(text):
        tok = tok.strip()
        if not tok:
            continue
        if _CJK.search(tok):
            tokens.append(tok)
        else:
            tokens.extend(_LATIN.findall(tok))
    return tokens


class IndexStore:
    def __init__(self, chunks: list[dict], embeddings: np.ndarray, meta: dict):
        self.chunks = chunks
        self.embeddings = np.asarray(embeddings, dtype=np.float32)
        self.meta = meta
        self._bm25: BM25Okapi | None = None
        self._tokens: list[list[str]] | None = None

    # --- BM25 (lazy) ---
    @property
    def bm25(self) -> BM25Okapi:
        if self._bm25 is None:
            self._tokens = [tokenize(c["text"]) for c in self.chunks]
            self._bm25 = BM25Okapi(self._tokens)
        return self._bm25

    # --- persistence ---
    def save(self, directory: str | Path) -> None:
        d = Path(directory)
        d.mkdir(parents=True, exist_ok=True)
        np.save(d / "embeddings.npy", self.embeddings)
        (d / "chunks.json").write_text(
            json.dumps(self.chunks, ensure_ascii=False), encoding="utf-8"
        )
        (d / "meta.json").write_text(
            json.dumps(self.meta, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    @classmethod
    def load(cls, directory: str | Path) -> "IndexStore":
        d = Path(directory)
        if not (d / "chunks.json").exists():
            raise FileNotFoundError(
                f"No index at {d}. Build it first: python -m app.ingest.build_index"
            )
        chunks = json.loads((d / "chunks.json").read_text(encoding="utf-8"))
        embeddings = np.load(d / "embeddings.npy")
        meta = json.loads((d / "meta.json").read_text(encoding="utf-8"))
        return cls(chunks, embeddings, meta)

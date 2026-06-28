"""Pluggable embedding backends.

`bge-m3`  -> sentence-transformers (default; multilingual, strong on Chinese)
`openai`  -> any OpenAI-compatible /embeddings endpoint (e.g. text-embedding-3)
`hash`    -> dependency-free hashing fallback so the pipeline runs end-to-end
            without the heavy model download (lower quality; for smoke tests)

All backends return L2-normalized float32 vectors, so a dot product == cosine.
"""
from __future__ import annotations

import hashlib
import re
from abc import ABC, abstractmethod

import numpy as np


def _normalize(mat: np.ndarray) -> np.ndarray:
    mat = np.asarray(mat, dtype=np.float32)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return mat / norms


class BaseEmbedder(ABC):
    name: str
    dim: int

    @abstractmethod
    def encode(self, texts: list[str]) -> np.ndarray:
        ...


class BGEEmbedder(BaseEmbedder):
    name = "bge-m3"

    def __init__(self, model: str = "BAAI/bge-m3"):
        from sentence_transformers import SentenceTransformer  # lazy: heavy import

        self.model_name = model
        self._model = SentenceTransformer(model)
        self.dim = self._model.get_sentence_embedding_dimension()

    def encode(self, texts: list[str]) -> np.ndarray:
        vecs = self._model.encode(
            texts, normalize_embeddings=True, show_progress_bar=False,
            batch_size=32, convert_to_numpy=True,
        )
        return np.asarray(vecs, dtype=np.float32)


class OpenAIEmbedder(BaseEmbedder):
    name = "openai"

    def __init__(self, model: str, base_url: str, api_key: str):
        from openai import OpenAI  # lazy

        if not api_key:
            raise RuntimeError("openai embedding backend requires an API key")
        self.model_name = model
        self._client = OpenAI(base_url=base_url or None, api_key=api_key)
        # Probe dimension once.
        probe = self._client.embeddings.create(model=model, input=["dim probe"])
        self.dim = len(probe.data[0].embedding)

    def encode(self, texts: list[str]) -> np.ndarray:
        out: list[list[float]] = []
        for i in range(0, len(texts), 64):  # batch to respect request limits
            resp = self._client.embeddings.create(
                model=self.model_name, input=texts[i : i + 64]
            )
            out.extend(d.embedding for d in resp.data)
        return _normalize(np.array(out, dtype=np.float32))


class HashEmbedder(BaseEmbedder):
    """Char-n-gram hashing trick. No external deps; deterministic; weak."""

    name = "hash"
    _token = re.compile(r"\w+", re.UNICODE)

    def __init__(self, dim: int = 512):
        self.dim = dim

    def _features(self, text: str):
        text = text.lower()
        words = self._token.findall(text)
        feats: list[str] = list(words)
        for w in words:  # char trigrams capture morphology + CJK
            padded = f"#{w}#"
            feats += [padded[i : i + 3] for i in range(len(padded) - 2)]
        return feats

    def encode(self, texts: list[str]) -> np.ndarray:
        mat = np.zeros((len(texts), self.dim), dtype=np.float32)
        for r, text in enumerate(texts):
            for feat in self._features(text):
                h = int(hashlib.md5(feat.encode("utf-8")).hexdigest(), 16)
                mat[r, h % self.dim] += 1.0
        return _normalize(mat)


def get_embedder(settings) -> BaseEmbedder:
    backend = settings.embedding_backend.lower()
    if backend == "bge-m3":
        return BGEEmbedder(settings.embedding_model)
    if backend == "openai":
        return OpenAIEmbedder(
            settings.openai_embedding_model,
            settings.embedding_base_url or settings.llm_base_url,
            settings.embedding_api_key or settings.llm_api_key,
        )
    if backend == "hash":
        return HashEmbedder()
    raise ValueError(f"unknown embedding_backend: {settings.embedding_backend!r}")

"""Split documents into overlapping, retrievable chunks.

Greedy paragraph packing into ~`target_chars` windows with a paragraph of
overlap, so semantically related sentences stay together. Character budget is
a language-agnostic proxy for tokens (works for the site's mixed EN/CN text).
"""
from __future__ import annotations

from .clean import Document

TARGET_CHARS = 1100
OVERLAP_CHARS = 200


def _split_paragraphs(text: str) -> list[str]:
    paras = [p.strip() for p in text.split("\n") if p.strip()]
    return paras or ([text.strip()] if text.strip() else [])


def chunk_document(doc: Document, target: int = TARGET_CHARS,
                   overlap: int = OVERLAP_CHARS) -> list[dict]:
    paras = _split_paragraphs(doc.text)
    chunks: list[dict] = []
    buf: list[str] = []
    size = 0
    pos = 0

    def flush():
        nonlocal buf, size, pos
        if not buf:
            return
        body = "\n".join(buf).strip()
        if body:
            chunks.append(_make_chunk(doc, pos, body))
            pos += 1
        # carry tail for overlap
        tail, tail_len = [], 0
        for p in reversed(buf):
            if tail_len >= overlap:
                break
            tail.insert(0, p)
            tail_len += len(p)
        buf = tail
        size = tail_len

    for para in paras:
        if size and size + len(para) > target:
            flush()
        buf.append(para)
        size += len(para)
    # final flush without overlap carry
    if buf:
        body = "\n".join(buf).strip()
        if body:
            chunks.append(_make_chunk(doc, pos, body))
    return chunks


def _make_chunk(doc: Document, position: int, body: str) -> dict:
    return {
        "id": f"{doc.doc_id}#{position}",
        "doc_id": doc.doc_id,
        "title": doc.title,
        "url": doc.url,
        "type": doc.type,
        "category": doc.category,
        "subcategory": doc.subcategory,
        "thumbnail": doc.thumbnail,
        "excerpt": doc.excerpt,
        "position": position,
        # Prepend title so the chunk is self-describing for embedding & BM25.
        "text": f"{doc.title}\n{body}" if position == 0 else body,
        "body": body,
    }


def chunk_documents(docs: list[Document]) -> list[dict]:
    out: list[dict] = []
    for doc in docs:
        out.extend(chunk_document(doc))
    return out

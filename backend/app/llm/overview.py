"""AI Overview generation over retrieved contexts (RAG).

Uses any OpenAI-compatible chat endpoint (DeepSeek / GPT-4o / self-hosted).
Streams tokens so the UI can render the answer progressively, like the
example site. Grounded + citation-constrained to curb hallucination.
"""
from __future__ import annotations

from collections.abc import Iterator

from app.config import settings

SYSTEM_PROMPT = (
    "You are the search assistant for a herbal-medicine testing & products "
    "company website. Answer the user's query using ONLY the numbered SOURCES "
    "provided. Write a concise, well-structured overview (2-4 short paragraphs "
    "or bullet points). Cite sources inline with [n] matching the source "
    "numbers. If the sources do not contain the answer, say so plainly and "
    "suggest browsing the results below. Never invent facts, prices, or claims. "
    "Reply in the language of the user's query."
)


def _build_user_prompt(query: str, contexts: list[dict]) -> str:
    blocks = [
        f"[{c['n']}] {c['title']}\n{c['text']}" for c in contexts
    ]
    sources = "\n\n".join(blocks) if blocks else "(no sources found)"
    return f"SOURCES:\n{sources}\n\nQUERY: {query}\n\nOverview:"


def stream_overview(query: str, contexts: list[dict]) -> Iterator[str]:
    """Yield overview text deltas. Falls back to a notice if no LLM is configured."""
    if not settings.llm_api_key:
        yield (
            "ℹ️ AI Overview is disabled (no LLM API key configured). "
            "Set LLM_API_KEY in .env to enable grounded AI summaries. "
            "The ranked results below are fully functional."
        )
        return
    if not contexts:
        yield "No matching content was found for this query on the site."
        return

    from openai import OpenAI  # lazy import

    client = OpenAI(base_url=settings.llm_base_url, api_key=settings.llm_api_key)
    try:
        stream = client.chat.completions.create(
            model=settings.llm_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            stream=True,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(query, contexts)},
            ],
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta
    except Exception as exc:  # surface provider errors to the UI gracefully
        yield f"\n\n⚠️ AI Overview unavailable: {exc}"

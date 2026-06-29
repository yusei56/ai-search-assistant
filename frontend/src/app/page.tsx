"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  search,
  streamOverview,
  type SearchResponse,
  type SearchResult,
  type Source,
} from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import { Facets } from "@/components/Facets";
import { ResultCard, ResultCardSkeleton } from "@/components/ResultCard";
import { AiOverview } from "@/components/AiOverview";

const PAGE_SIZE = 10;
const EXAMPLES = [
  "ginseng quality testing",
  "fingerprint analysis",
  "pesticide residue detection",
  "active ingredient extraction",
];

function relatedSearchesFor(query: string) {
  const q = query.trim();
  const items = [
    ...EXAMPLES,
    `${q} methods`,
    `${q} services`,
    `${q} analysis`,
  ];
  return Array.from(new Set(items))
    .filter((item) => item.trim() && item.toLowerCase() !== q.toLowerCase())
    .slice(0, 5);
}

function TopBar({ active }: { active: boolean }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5">
      {active && (
        <div className="loading-bar relative h-full w-full overflow-hidden bg-brand-100" />
      )}
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [streaming, setStreaming] = useState(false);
  const closeStream = useRef<(() => void) | null>(null);
  const requestSeq = useRef(0);

  const fetchResults = useCallback(
    async (
      q: string,
      cat: string | null,
      off: number,
      append: boolean
    ): Promise<SearchResponse | null> => {
      setLoading(true);
      setError("");
      try {
        const res = await search(q, { category: cat, offset: off, limit: PAGE_SIZE });
        setTotal(res.total);
        if (off === 0) setFacets(res.facets);
        setResults((prev) => (append ? [...prev, ...res.results] : res.results));
        return res;
      } catch (err) {
        const timedOut = err instanceof Error && err.name === "AbortError";
        setError(
          timedOut
            ? "Search timed out. Please try again."
            : "Search failed - is the backend running on :8000?"
        );
        if (!append) setResults([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const runOverview = useCallback((q: string) => {
    closeStream.current?.();
    setOverview("");
    setSources([]);
    setStreaming(true);
    closeStream.current = streamOverview(q, {
      onSources: setSources,
      onDelta: (t) => setOverview((prev) => prev + t),
      onDone: () => setStreaming(false),
      onError: () => setStreaming(false),
    });
  }, []);

  const onSubmit = useCallback(
    (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      requestSeq.current += 1;
      const seq = requestSeq.current;
      closeStream.current?.();
      setStreaming(false);
      setOverview("");
      setSources([]);
      setQuery(q);
      setCategory(null);
      setOffset(0);
      // Shareable URL, mirroring the reference site (/results?q=...).
      window.history.replaceState(null, "", `/?q=${encodeURIComponent(q)}`);
      void fetchResults(q, null, 0, false).then((res) => {
        if (requestSeq.current === seq && res && res.total > 0) runOverview(q);
      });
    },
    [fetchResults, runOverview]
  );

  // Run an initial search from a ?q= URL param (deep-linkable / shareable).
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      window.setTimeout(() => {
        setInput(q);
        onSubmit(q);
      }, 0);
    }
  }, [onSubmit]);

  const onSelectCategory = useCallback(
    (cat: string | null) => {
      setCategory(cat);
      setOffset(0);
      fetchResults(query, cat, 0, false);
    },
    [fetchResults, query]
  );

  const loadMore = useCallback(() => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchResults(query, category, next, true);
  }, [offset, query, category, fetchResults]);

  const goHome = () => {
    requestSeq.current += 1;
    closeStream.current?.();
    setStreaming(false);
    setQuery("");
    setInput("");
    setResults([]);
    window.history.replaceState(null, "", "/");
  };

  const runSearch = useCallback(
    (nextQuery: string) => {
      setInput(nextQuery);
      onSubmit(nextQuery);
    },
    [onSubmit]
  );

  const hasSearched = query !== "";
  const initialLoading = loading && results.length === 0;
  const relatedSearches = hasSearched ? relatedSearchesFor(query) : [];

  // ---- Hero (initial) state ----
  if (!hasSearched) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-brand-50),transparent)]" />
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
              AI-powered search
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
              Herbal Medicine Knowledge Search
            </h1>
            <p className="mt-2 text-slate-500">
              Ask about testing services, herbs, methods, and more.
            </p>
          </div>
          <SearchBar value={input} onChange={setInput} onSubmit={onSubmit} />
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <a
                key={ex}
                href={`/?q=${encodeURIComponent(ex)}`}
                onClick={(event) => {
                  event.preventDefault();
                  runSearch(ex);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
              >
                {ex}
              </a>
            ))}
          </div>
        </div>
        <footer className="absolute bottom-5 text-xs text-slate-400">
          RAG over the site&apos;s own content · hybrid retrieval + grounded AI overview
        </footer>
      </main>
    );
  }

  // ---- Results state ----
  return (
    <div className="min-h-screen">
      <TopBar active={loading || streaming} />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4">
          <button
            onClick={goHome}
            className="shrink-0 text-base font-bold text-brand-700 sm:text-lg"
          >
            🌿<span className="hidden sm:inline"> HerbSearch</span>
          </button>
          <div className="max-w-2xl flex-1">
            <SearchBar value={input} onChange={setInput} onSubmit={onSubmit} compact />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <div className="md:sticky md:top-20 md:self-start">
          <Facets facets={facets} active={category} onSelect={onSelectCategory} />
        </div>

        <div className="min-w-0 space-y-5">
          <AiOverview text={overview} sources={sources} streaming={streaming} />

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              {initialLoading ? (
                "Searching…"
              ) : (
                <>
                  <span className="font-semibold text-slate-700">{total}</span>{" "}
                  result{total === 1 ? "" : "s"} for{" "}
                  <span className="font-medium text-slate-700">“{query}”</span>
                  {category && <span> in {category}</span>}
                </>
              )}
            </p>
          </div>

          {relatedSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase text-slate-400">
                Related searches
              </span>
              {relatedSearches.map((item) => (
                <a
                  key={item}
                  href={`/?q=${encodeURIComponent(item)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    runSearch(item);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  {item}
                </a>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {initialLoading
              ? Array.from({ length: 4 }).map((_, i) => <ResultCardSkeleton key={i} />)
              : results.map((r) => <ResultCard key={r.doc_id} r={r} />)}
          </div>

          {!loading && results.length === 0 && !error && (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <p className="text-slate-500">No results found for “{query}”.</p>
              <p className="mt-1 text-sm text-slate-400">Try a different term.</p>
            </div>
          )}

          {results.length < total && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
              >
                {loading ? "Loading…" : `Load more (${total - results.length} left)`}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

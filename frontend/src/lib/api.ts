// Thin client for the AI Search backend.
function defaultApiBase() {
  if (typeof window === "undefined") return "http://127.0.0.1:8000";
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "";
}

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || defaultApiBase()
).replace(/\/$/, "");

const SEARCH_TIMEOUT_MS = 20_000;
const SUGGEST_TIMEOUT_MS = 5_000;
const STREAM_TIMEOUT_MS = 45_000;

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export interface SearchResult {
  doc_id: string;
  title: string;
  url: string;
  category: string;
  subcategory: string;
  type: string;
  thumbnail: string | null;
  snippet: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
  facets: Record<string, number>;
}

export interface Source {
  n: number;
  title: string;
  url: string;
  text: string;
}

export async function search(
  q: string,
  opts: { category?: string | null; offset?: number; limit?: number } = {}
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q });
  if (opts.category) params.set("category", opts.category);
  if (opts.offset) params.set("offset", String(opts.offset));
  if (opts.limit) params.set("limit", String(opts.limit));
  const res = await fetchWithTimeout(
    `${API_BASE}/api/search?${params}`,
    SEARCH_TIMEOUT_MS
  );
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return res.json();
}

export async function suggest(q: string): Promise<string[]> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/api/suggest?q=${encodeURIComponent(q)}`,
      SUGGEST_TIMEOUT_MS
    );
    if (!res.ok) return [];
    return (await res.json()).suggestions ?? [];
  } catch {
    return [];
  }
}

// Stream the AI overview via SSE. Returns a function to close the stream.
export function streamOverview(
  q: string,
  handlers: {
    onSources?: (s: Source[]) => void;
    onDelta?: (text: string) => void;
    onDone?: () => void;
    onError?: (msg: string) => void;
  }
): () => void {
  const es = new EventSource(
    `${API_BASE}/api/overview?q=${encodeURIComponent(q)}`
  );
  let closed = false;
  const timer = window.setTimeout(() => {
    handlers.onError?.("stream timeout");
    close();
  }, STREAM_TIMEOUT_MS);
  const close = () => {
    if (closed) return;
    closed = true;
    window.clearTimeout(timer);
    es.close();
  };

  es.addEventListener("sources", (e) => {
    try {
      handlers.onSources?.(JSON.parse((e as MessageEvent).data));
    } catch {
      /* ignore malformed */
    }
  });
  es.addEventListener("delta", (e) => {
    try {
      handlers.onDelta?.(JSON.parse((e as MessageEvent).data));
    } catch {
      handlers.onDelta?.((e as MessageEvent).data);
    }
  });
  es.addEventListener("done", () => {
    handlers.onDone?.();
    close();
  });
  es.addEventListener("error", () => {
    handlers.onError?.("stream error");
    close();
  });
  return close;
}

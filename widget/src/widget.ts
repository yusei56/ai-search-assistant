/**
 * Embeddable AI Search widget.
 *
 * Drop into any page (incl. WordPress) with:
 *   <script src="https://your-host/ai-search-widget.js"
 *           data-api-base="https://your-backend"
 *           data-accent="#059669"
 *           data-title="Search"></script>
 *
 * Renders a floating launcher + search panel inside a Shadow DOM so the host
 * page's CSS can never leak in. Talks to GET /api/search and /api/overview.
 */

interface Cfg {
  apiBase: string;
  accent: string;
  title: string;
}

interface Result {
  doc_id: string;
  title: string;
  url: string;
  category: string;
  subcategory?: string;
  thumbnail?: string | null;
  snippet: string;
}

interface SearchResponse {
  total: number;
  results: Result[];
  facets: Record<string, number>;
}

interface Source {
  n: number;
  title: string;
  url: string;
  text: string;
}

const PAGE_SIZE = 8;
const REQUEST_TIMEOUT_MS = 20_000;
const STREAM_TIMEOUT_MS = 45_000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function readConfig(): Cfg {
  const el =
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>("script[data-api-base]");
  return {
    apiBase: (el?.dataset.apiBase ?? "http://127.0.0.1:8000").replace(/\/$/, ""),
    accent: el?.dataset.accent ?? "#059669",
    title: el?.dataset.title ?? "AI Search",
  };
}

function styles(accent: string): string {
  return `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .launch { position: fixed; bottom: 24px; right: 24px; z-index: 2147483000;
    display: flex; align-items: center; gap: 8px; padding: 12px 18px; border: none;
    border-radius: 999px; background: ${accent}; color: #fff; font-size: 14px;
    font-weight: 700; cursor: pointer; box-shadow: 0 6px 20px rgba(0,0,0,.18); }
  .overlay { position: fixed; inset: 0; z-index: 2147483001; display: none;
    background: rgba(15,23,42,.45); backdrop-filter: blur(2px); }
  .overlay.open { display: block; }
  .panel { position: absolute; top: 0; right: 0; height: 100%; width: 500px;
    max-width: 100%; background: #f8fafc; box-shadow: -8px 0 30px rgba(0,0,0,.2);
    display: flex; flex-direction: column; }
  .head { display: flex; align-items: center; gap: 10px; padding: 16px;
    background: #fff; border-bottom: 1px solid #e2e8f0; }
  .head h2 { margin: 0; font-size: 16px; color: #0f172a; flex: 1; font-weight: 800; }
  .close { border: none; background: none; font-size: 22px; cursor: pointer; color: #64748b; }
  .searchrow { padding: 14px 16px; background: #fff; border-bottom: 1px solid #e2e8f0; }
  .searchrow form { display: flex; gap: 8px; align-items: center; }
  .searchrow input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1;
    border-radius: 999px; font-size: 14px; outline: none; color: #0f172a; }
  .searchrow input:focus { border-color: ${accent}; box-shadow: 0 0 0 3px ${accent}22; }
  .searchrow button, .load { border: none; border-radius: 999px; background: ${accent};
    color: #fff; padding: 10px 14px; font-size: 13px; font-weight: 700; cursor: pointer; }
  .body { flex: 1; overflow-y: auto; padding: 16px; }
  .ai { background: ${accent}0d; border: 1px solid ${accent}33; border-radius: 14px;
    padding: 14px; margin-bottom: 14px; font-size: 14px; line-height: 1.6; color: #1e293b; }
  .ai .tag { display: inline-block; background: ${accent}; color: #fff; font-size: 11px;
    font-weight: 800; padding: 2px 6px; border-radius: 5px; margin-bottom: 8px; }
  .ai p { margin: 0 0 9px; }
  .cite { display: inline-flex; transform: translateY(-1px); margin: 0 2px; padding: 1px 5px;
    border-radius: 999px; background: ${accent}18; color: ${accent}; font-size: 11px;
    font-weight: 800; text-decoration: none; }
  .sources { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; padding-top: 10px;
    border-top: 1px solid ${accent}22; }
  .source { max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; color: #475569;
    padding: 4px 8px; font-size: 12px; text-decoration: none; }
  .facets { display: flex; gap: 7px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 12px; }
  .facet { white-space: nowrap; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff;
    color: #475569; padding: 6px 9px; font-size: 12px; cursor: pointer; }
  .facet.active { border-color: ${accent}33; background: ${accent}12; color: ${accent}; font-weight: 800; }
  .summary { color: #64748b; font-size: 13px; margin: 0 0 10px; }
  .card { display: flex; gap: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 12px; margin-bottom: 10px; text-decoration: none; transition: .15s; }
  .card:hover { border-color: ${accent}; box-shadow: 0 3px 12px rgba(0,0,0,.07); }
  .thumb { width: 54px; height: 54px; flex: 0 0 auto; border-radius: 9px; object-fit: cover; background: #e2e8f0; }
  .card .cat { display: inline-flex; max-width: 100%; border-radius: 999px; background: ${accent}12;
    color: ${accent}; padding: 2px 7px; font-size: 11px; font-weight: 800; }
  .card .t { font-size: 15px; font-weight: 700; color: #1e293b; margin: 5px 0 3px; line-height: 1.25; }
  .card .s { font-size: 13px; color: #64748b; line-height: 1.5; }
  .muted { color: #94a3b8; font-size: 13px; text-align: center; padding: 24px; }
  .loadrow { display: flex; justify-content: center; padding: 4px 0 16px; }
  .load[disabled] { opacity: .55; cursor: wait; }
  @media (max-width: 560px) {
    .panel { width: 100%; }
    .thumb { display: none; }
  }
  `;
}

function init() {
  const cfg = readConfig();
  const host = document.createElement("div");
  host.id = "ai-search-widget-host";
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  root.innerHTML = `
    <style>${styles(cfg.accent)}</style>
    <button class="launch" part="launch">Search</button>
    <div class="overlay">
      <div class="panel" role="dialog" aria-label="${cfg.title}">
        <div class="head"><h2>${cfg.title}</h2><button class="close" aria-label="Close">x</button></div>
        <div class="searchrow">
          <form>
            <input type="search" placeholder="Type a query and press Enter..." />
            <button type="submit">Search</button>
          </form>
        </div>
        <div class="body"><p class="muted">Start typing to search.</p></div>
      </div>
    </div>`;

  const overlay = root.querySelector<HTMLDivElement>(".overlay")!;
  const form = root.querySelector<HTMLFormElement>("form")!;
  const input = root.querySelector<HTMLInputElement>("input")!;
  const body = root.querySelector<HTMLDivElement>(".body")!;

  let es: EventSource | null = null;
  let query = "";
  let category: string | null = null;
  let offset = 0;
  let total = 0;
  let results: Result[] = [];
  let facets: Record<string, number> = {};
  let overview = "";
  let sources: Source[] = [];
  let loading = false;
  let error = "";
  let streamTimer: number | undefined;

  const esc = (s: string) =>
    s.replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string
    );

  const open = () => {
    overlay.classList.add("open");
    setTimeout(() => input.focus(), 50);
  };
  const close = () => {
    overlay.classList.remove("open");
    if (streamTimer) window.clearTimeout(streamTimer);
    streamTimer = undefined;
    es?.close();
  };

  function overviewHtml() {
    if (!overview) return `<span class="ovtext">Generating...</span>`;
    const byN = new Map(sources.map((source) => [String(source.n), source]));
    const linked = esc(overview).replace(/\[(\d+)\]/g, (match, n) => {
      const source = byN.get(n);
      if (!source) return match;
      return `<a class="cite" href="${esc(source.url)}" title="${esc(source.title)}" target="_blank" rel="noopener">${n}</a>`;
    });
    return linked
      .split(/\n{2,}/)
      .map((part) => `<p>${part.replace(/\n/g, "<br />")}</p>`)
      .join("");
  }

  function renderFacets() {
    const entries = Object.entries(facets).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return "";
    const all = entries.reduce((sum, [, count]) => sum + count, 0);
    return `<div class="facets">
      <button class="facet ${category === null ? "active" : ""}" data-category="">All (${all})</button>
      ${entries
        .map(([cat, count]) => `<button class="facet ${category === cat ? "active" : ""}" data-category="${encodeURIComponent(cat)}">${esc(cat)} (${count})</button>`)
        .join("")}
    </div>`;
  }

  function resultCard(r: Result) {
    const image = r.thumbnail ? `<img class="thumb" src="${esc(r.thumbnail)}" alt="" loading="lazy" />` : "";
    return `<a class="card" href="${esc(r.url)}" target="_blank" rel="noopener">
      ${image}
      <div>
        <div class="cat">${esc(r.category)}</div>
        <div class="t">${esc(r.title)}</div>
        <div class="s">${esc(r.snippet)}</div>
      </div>
    </a>`;
  }

  function render() {
    const sourceHtml = sources.length
      ? `<div class="sources">${sources
          .map((source) => `<a class="source" href="${esc(source.url)}" target="_blank" rel="noopener">${source.n}. ${esc(source.title)}</a>`)
          .join("")}</div>`
      : "";

    const summary = query
      ? `<p class="summary">${loading && !results.length ? "Searching..." : `${total} results for "${esc(query)}"${category ? ` in ${esc(category)}` : ""}`}</p>`
      : "";

    const cards = error
      ? `<p class="muted">${esc(error)}</p>`
      : results.length
        ? results.map(resultCard).join("")
        : query && !loading
          ? `<p class="muted">No results found.</p>`
          : `<p class="muted">${query ? "Searching..." : "Start typing to search."}</p>`;

    const load = results.length < total
      ? `<div class="loadrow"><button class="load" type="button" ${loading ? "disabled" : ""}>${loading ? "Loading..." : `Load more (${total - results.length} left)`}</button></div>`
      : "";

    body.innerHTML = `
      <div class="ai"><span class="tag">AI</span>${overviewHtml()}${sourceHtml}</div>
      ${renderFacets()}
      ${summary}
      <div class="results">${cards}</div>
      ${load}`;

    body.querySelectorAll<HTMLButtonElement>(".facet").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.category || "";
        category = value ? decodeURIComponent(value) : null;
        offset = 0;
        void fetchResults(false);
      });
    });
    body.querySelector<HTMLButtonElement>(".load")?.addEventListener("click", () => {
      offset += PAGE_SIZE;
      void fetchResults(true);
    });
  }

  async function fetchResults(append: boolean): Promise<boolean> {
    if (!query) return false;
    loading = true;
    error = "";
    render();
    const params = new URLSearchParams({ q: query, offset: String(offset), limit: String(PAGE_SIZE) });
    if (category) params.set("category", category);

    try {
      const res = await fetchWithTimeout(`${cfg.apiBase}/api/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as SearchResponse;
      total = data.total ?? 0;
      if (!append) facets = data.facets ?? {};
      results = append ? [...results, ...(data.results ?? [])] : data.results ?? [];
      return true;
    } catch {
      total = 0;
      if (!append) results = [];
      error = `Search failed. Check that the backend is reachable at ${cfg.apiBase}.`;
      return false;
    } finally {
      loading = false;
      render();
    }
  }

  function streamOverview() {
    es?.close();
    if (streamTimer) window.clearTimeout(streamTimer);
    overview = "";
    sources = [];
    render();
    es = new EventSource(`${cfg.apiBase}/api/overview?q=${encodeURIComponent(query)}`);
    streamTimer = window.setTimeout(() => {
      overview ||= "AI overview timed out. The ranked results below are still available.";
      es?.close();
      render();
    }, STREAM_TIMEOUT_MS);
    const stopStream = () => {
      if (streamTimer) window.clearTimeout(streamTimer);
      streamTimer = undefined;
      es?.close();
    };
    es.addEventListener("sources", (e) => {
      try {
        sources = JSON.parse((e as MessageEvent).data) as Source[];
        render();
      } catch {
        /* ignore malformed sources */
      }
    });
    es.addEventListener("delta", (e) => {
      try {
        overview += JSON.parse((e as MessageEvent).data);
      } catch {
        overview += (e as MessageEvent).data;
      }
      render();
    });
    es.addEventListener("done", stopStream);
    es.addEventListener("error", stopStream);
  }

  function run(q: string) {
    const next = q.trim();
    if (!next) return;
    query = next;
    category = null;
    offset = 0;
    total = 0;
    results = [];
    facets = {};
    input.value = next;
    open();
    render();
    void fetchResults(false).then((ok) => {
      if (ok && total > 0) streamOverview();
    });
  }

  const search = (q: string) => run(q);
  const api = {
    open: (q?: string) => {
      if (q?.trim()) search(q);
      else open();
    },
    search,
    close,
  };
  (window as Window & { AISearchAssistant?: typeof api }).AISearchAssistant = api;

  root.querySelector(".launch")!.addEventListener("click", open);
  root.querySelector(".close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run(input.value);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

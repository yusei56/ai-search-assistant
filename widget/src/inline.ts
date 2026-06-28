/**
 * Inline AI Search page widget.
 *
 * Use this on a WordPress page such as /ai-search/ with:
 *   <div id="ai-search-root"></div>
 *   <script src="https://your-host/ai-search-inline.js"
 *           data-api-base="https://your-host"
 *           data-target="#ai-search-root"></script>
 */

interface InlineConfig {
  apiBase: string;
  accent: string;
  title: string;
  target: string;
  queryParam: string;
}

interface SearchResult {
  doc_id: string;
  title: string;
  url: string;
  category: string;
  subcategory?: string;
  thumbnail?: string | null;
  snippet: string;
}

interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
  facets: Record<string, number>;
}

interface Source {
  n: number;
  title: string;
  url: string;
  text: string;
}

const PAGE_SIZE = 10;
const REQUEST_TIMEOUT_MS = 20_000;
const STREAM_TIMEOUT_MS = 45_000;
const EXAMPLES = [
  "ginseng quality testing",
  "fingerprint analysis",
  "pesticide residue detection",
  "active ingredient extraction",
];

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function scriptEl(): HTMLScriptElement | null {
  return (
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>("script[src*='ai-search-inline']")
  );
}

function readConfig(): InlineConfig {
  const el = scriptEl();
  return {
    apiBase: (el?.dataset.apiBase ?? "http://127.0.0.1:8000").replace(/\/$/, ""),
    accent: el?.dataset.accent ?? "#059669",
    title: el?.dataset.title ?? "AI Search",
    target: el?.dataset.target ?? "#ai-search-root",
    queryParam: el?.dataset.queryParam ?? "q",
  };
}

function esc(value: string): string {
  return value.replace(/[&<>"]/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };
    return map[char];
  });
}

function styles(accent: string): string {
  return `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .app { color: #0f172a; background: #f8fafc; min-height: 640px; }
  .top { position: sticky; top: 0; z-index: 5; border-bottom: 1px solid #e2e8f0; background: rgba(255,255,255,.92); backdrop-filter: blur(10px); }
  .top-inner { max-width: 1120px; margin: 0 auto; display: flex; align-items: center; gap: 16px; padding: 14px 20px; }
  .brand { color: ${accent}; font-size: 18px; font-weight: 800; white-space: nowrap; }
  .hero { max-width: 760px; margin: 0 auto; padding: 92px 20px 80px; text-align: center; }
  .badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid ${accent}33; background: ${accent}12; color: ${accent}; border-radius: 999px; padding: 5px 12px; font-size: 13px; font-weight: 700; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: ${accent}; }
  h1 { margin: 18px 0 10px; color: #0f172a; font-size: clamp(34px, 6vw, 56px); line-height: 1.05; letter-spacing: 0; }
  .sub { margin: 0 0 28px; color: #64748b; font-size: 18px; }
  .search { display: flex; align-items: center; gap: 10px; width: 100%; border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 10px 12px 10px 18px; box-shadow: 0 8px 24px rgba(15,23,42,.08); }
  .search:focus-within { border-color: ${accent}; box-shadow: 0 0 0 4px ${accent}1a; }
  .search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: #0f172a; font-size: 16px; }
  .search button, .load { border: 0; border-radius: 999px; background: ${accent}; color: #fff; padding: 10px 18px; font-weight: 700; cursor: pointer; }
  .search button:hover, .load:hover { filter: brightness(.94); }
  .examples { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 20px; }
  .examples button, .facet { border: 1px solid #e2e8f0; background: #fff; color: #475569; border-radius: 999px; padding: 8px 12px; cursor: pointer; }
  .examples button:hover, .facet:hover { border-color: ${accent}; color: ${accent}; }
  .results-view { display: none; max-width: 1120px; margin: 0 auto; padding: 26px 20px 48px; grid-template-columns: 230px minmax(0, 1fr); gap: 28px; }
  .results-view.active { display: grid; }
  .hero.hidden { display: none; }
  .facets { position: sticky; top: 78px; align-self: start; }
  .facet-title { margin: 0 0 10px; color: #334155; font-size: 14px; font-weight: 800; }
  .facet-list { display: grid; gap: 6px; }
  .facet { width: 100%; display: flex; justify-content: space-between; gap: 8px; border-radius: 9px; text-align: left; }
  .facet.active { border-color: ${accent}33; background: ${accent}12; color: ${accent}; font-weight: 800; }
  .count { color: #94a3b8; }
  .overview { border: 1px solid ${accent}26; background: linear-gradient(135deg, ${accent}10, #fff 42%, #fff); border-radius: 14px; padding: 20px; box-shadow: 0 6px 20px rgba(15,23,42,.05); }
  .overview-head { display: flex; align-items: center; gap: 10px; color: #334155; font-size: 15px; font-weight: 800; }
  .overview-icon { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: ${accent}; color: #fff; }
  .overview-body { margin-top: 12px; color: #1e293b; font-size: 15px; line-height: 1.65; }
  .overview-body p { margin: 0 0 10px; }
  .cite { display: inline-flex; transform: translateY(-1px); margin: 0 2px; padding: 1px 5px; border-radius: 999px; background: ${accent}18; color: ${accent}; font-size: 11px; font-weight: 800; text-decoration: none; }
  .sources { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid ${accent}1f; }
  .source { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; color: #475569; padding: 5px 9px; font-size: 12px; text-decoration: none; }
  .summary { color: #64748b; margin: 20px 0 12px; font-size: 14px; }
  .cards { display: grid; gap: 12px; }
  .card { display: flex; gap: 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 14px; padding: 14px; color: inherit; text-decoration: none; transition: .15s ease; }
  .card:hover { border-color: ${accent}; transform: translateY(-1px); box-shadow: 0 8px 22px rgba(15,23,42,.07); }
  .thumb { width: 72px; height: 72px; flex: 0 0 auto; border-radius: 10px; object-fit: cover; background: #e2e8f0; }
  .pill { display: inline-flex; max-width: 100%; border-radius: 999px; background: ${accent}12; color: ${accent}; padding: 3px 8px; font-size: 12px; font-weight: 800; }
  .card h3 { margin: 7px 0 5px; font-size: 17px; line-height: 1.25; color: #0f172a; }
  .card p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.55; }
  .muted, .error { color: #64748b; padding: 18px; text-align: center; }
  .error { border: 1px solid #fbbf24; background: #fffbeb; color: #92400e; border-radius: 12px; text-align: left; }
  .load-row { display: flex; justify-content: center; margin-top: 18px; }
  .load[disabled] { opacity: .55; cursor: wait; }
  @media (max-width: 760px) {
    .top-inner { display: block; padding: 12px; }
    .brand { margin-bottom: 10px; }
    .results-view.active { display: block; padding: 16px 12px 36px; }
    .facets { position: static; margin-bottom: 16px; }
    .facet-list { grid-template-columns: 1fr 1fr; }
    .card { display: block; }
    .thumb { display: none; }
    h1 { font-size: 38px; }
  }
  `;
}

function resultCard(r: SearchResult): string {
  const image = r.thumbnail ? `<img class="thumb" src="${esc(r.thumbnail)}" alt="" loading="lazy" />` : "";
  const sub = r.subcategory && r.subcategory !== r.category ? ` <span class="count">${esc(r.subcategory)}</span>` : "";
  return `<a class="card" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">
    ${image}
    <div>
      <span class="pill">${esc(r.category)}</span>${sub}
      <h3>${esc(r.title)}</h3>
      <p>${esc(r.snippet)}</p>
    </div>
  </a>`;
}

function overviewHtml(text: string, sources: Source[]): string {
  if (!text) return `<div class="muted">Generating AI overview...</div>`;
  const sourceMap = new Map(sources.map((source) => [String(source.n), source]));
  const linked = esc(text).replace(/\[(\d+)\]/g, (match, n) => {
    const source = sourceMap.get(n);
    if (!source) return match;
    return `<a class="cite" href="${esc(source.url)}" title="${esc(source.title)}" target="_blank" rel="noopener noreferrer">${n}</a>`;
  });
  return linked
    .split(/\n{2,}/)
    .map((part) => `<p>${part.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function initInline() {
  const cfg = readConfig();
  let container = document.querySelector<HTMLElement>(cfg.target);
  if (!container) {
    container = document.createElement("div");
    container.id = cfg.target.replace(/^#/, "") || "ai-search-root";
    document.body.appendChild(container);
  }

  const root = container.attachShadow ? container.attachShadow({ mode: "open" }) : container;
  root.innerHTML = `
    <style>${styles(cfg.accent)}</style>
    <div class="app">
      <header class="top" hidden>
        <div class="top-inner">
          <div class="brand">${esc(cfg.title)}</div>
          <form class="search compact" data-search-form>
            <input type="search" placeholder="Search herbal testing services, herbs, methods..." />
            <button type="submit">Search</button>
          </form>
        </div>
      </header>
      <section class="hero">
        <span class="badge"><span class="dot"></span>AI-powered search</span>
        <h1>Herbal Medicine Knowledge Search</h1>
        <p class="sub">Ask about testing services, herbs, methods, and more.</p>
        <form class="search" data-search-form>
          <input type="search" placeholder="Search herbal testing services, herbs, methods..." />
          <button type="submit">Search</button>
        </form>
        <div class="examples"></div>
      </section>
      <main class="results-view">
        <aside class="facets">
          <h2 class="facet-title">Filters</h2>
          <div class="facet-list"></div>
        </aside>
        <section class="main-results">
          <div class="overview">
            <div class="overview-head"><span class="overview-icon">AI</span> AI Overview</div>
            <div class="overview-body"></div>
            <div class="sources"></div>
          </div>
          <div class="summary"></div>
          <div class="error" hidden></div>
          <div class="cards"></div>
          <div class="load-row"><button class="load" type="button" hidden>Load more</button></div>
        </section>
      </main>
    </div>`;

  const top = root.querySelector<HTMLElement>(".top")!;
  const hero = root.querySelector<HTMLElement>(".hero")!;
  const resultsView = root.querySelector<HTMLElement>(".results-view")!;
  const examples = root.querySelector<HTMLElement>(".examples")!;
  const forms = Array.from(root.querySelectorAll<HTMLFormElement>("[data-search-form]"));
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="search"]'));
  const facetList = root.querySelector<HTMLElement>(".facet-list")!;
  const overviewBody = root.querySelector<HTMLElement>(".overview-body")!;
  const sourcesEl = root.querySelector<HTMLElement>(".sources")!;
  const summary = root.querySelector<HTMLElement>(".summary")!;
  const cards = root.querySelector<HTMLElement>(".cards")!;
  const errorEl = root.querySelector<HTMLElement>(".error")!;
  const load = root.querySelector<HTMLButtonElement>(".load")!;

  let query = "";
  let category: string | null = null;
  let offset = 0;
  let total = 0;
  let results: SearchResult[] = [];
  let facets: Record<string, number> = {};
  let overview = "";
  let sources: Source[] = [];
  let loading = false;
  let stream: EventSource | null = null;
  let streamTimer: number | undefined;

  function setInputs(value: string) {
    inputs.forEach((input) => {
      input.value = value;
    });
  }

  function showResults() {
    top.hidden = false;
    hero.classList.add("hidden");
    resultsView.classList.add("active");
  }

  function renderFacets() {
    const entries = Object.entries(facets).sort((a, b) => b[1] - a[1]);
    const allCount = entries.reduce((sum, [, count]) => sum + count, 0);
    facetList.innerHTML = [
      `<button class="facet ${category === null ? "active" : ""}" data-category="">All categories <span class="count">${allCount}</span></button>`,
      ...entries.map(([cat, count]) => {
        const active = category === cat ? "active" : "";
        return `<button class="facet ${active}" data-category="${encodeURIComponent(cat)}"><span>${esc(cat)}</span><span class="count">${count}</span></button>`;
      }),
    ].join("");
    facetList.querySelectorAll<HTMLButtonElement>("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.dataset.category || "";
        category = value ? decodeURIComponent(value) : null;
        offset = 0;
        void fetchResults(false);
      });
    });
  }

  function renderOverview() {
    overviewBody.innerHTML = overviewHtml(overview, sources);
    sourcesEl.innerHTML = sources.length
      ? sources
          .map((source) => `<a class="source" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${source.n}. ${esc(source.title)}</a>`)
          .join("")
      : "";
  }

  function renderResults() {
    renderFacets();
    renderOverview();
    const label = category ? ` in ${category}` : "";
    summary.innerHTML = loading && results.length === 0
      ? "Searching..."
      : `<strong>${total}</strong> results for <strong>"${esc(query)}"</strong>${esc(label)}`;
    cards.innerHTML = results.length
      ? results.map(resultCard).join("")
      : loading
        ? `<div class="muted">Searching...</div>`
        : `<div class="muted">No results found. Try a different term.</div>`;
    load.hidden = results.length >= total || total === 0;
    load.disabled = loading;
    load.textContent = loading ? "Loading..." : `Load more (${Math.max(0, total - results.length)} left)`;
  }

  async function fetchResults(append: boolean): Promise<boolean> {
    if (!query) return false;
    loading = true;
    errorEl.hidden = true;
    renderResults();

    const params = new URLSearchParams({ q: query, limit: String(PAGE_SIZE), offset: String(offset) });
    if (category) params.set("category", category);

    try {
      const response = await fetchWithTimeout(`${cfg.apiBase}/api/search?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as SearchResponse;
      total = data.total;
      if (!append) facets = data.facets || {};
      results = append ? [...results, ...(data.results || [])] : data.results || [];
      return true;
    } catch (error) {
      if (!append) results = [];
      errorEl.hidden = false;
      errorEl.textContent = `Search failed. Check that the backend is reachable at ${cfg.apiBase}.`;
      console.error(error);
      return false;
    } finally {
      loading = false;
      renderResults();
    }
  }

  function startOverview() {
    stream?.close();
    if (streamTimer) window.clearTimeout(streamTimer);
    overview = "";
    sources = [];
    renderOverview();

    stream = new EventSource(`${cfg.apiBase}/api/overview?q=${encodeURIComponent(query)}`);
    streamTimer = window.setTimeout(() => {
      overview ||= "AI overview timed out. The ranked results below are still available.";
      stream?.close();
      renderOverview();
    }, STREAM_TIMEOUT_MS);
    const stopStream = () => {
      if (streamTimer) window.clearTimeout(streamTimer);
      streamTimer = undefined;
      stream?.close();
    };
    stream.addEventListener("sources", (event) => {
      try {
        sources = JSON.parse((event as MessageEvent).data) as Source[];
        renderOverview();
      } catch {
        /* ignore malformed source payloads */
      }
    });
    stream.addEventListener("delta", (event) => {
      try {
        overview += JSON.parse((event as MessageEvent).data) as string;
      } catch {
        overview += (event as MessageEvent).data;
      }
      renderOverview();
    });
    stream.addEventListener("done", stopStream);
    stream.addEventListener("error", stopStream);
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set(cfg.queryParam, query);
    window.history.replaceState(null, "", url.toString());
  }

  function run(raw: string) {
    const next = raw.trim();
    if (!next) return;
    query = next;
    category = null;
    offset = 0;
    total = 0;
    results = [];
    facets = {};
    setInputs(query);
    showResults();
    updateUrl();
    renderResults();
    void fetchResults(false).then((ok) => {
      if (ok && total > 0) startOverview();
    });
  }

  examples.innerHTML = EXAMPLES.map((item) => `<button type="button" data-example="${esc(item)}">${esc(item)}</button>`).join("");
  examples.querySelectorAll<HTMLButtonElement>("[data-example]").forEach((button) => {
    button.addEventListener("click", () => run(button.dataset.example || ""));
  });

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector<HTMLInputElement>('input[type="search"]');
      run(input?.value || "");
    });
  });

  load.addEventListener("click", () => {
    offset += PAGE_SIZE;
    void fetchResults(true);
  });

  const initial = new URLSearchParams(window.location.search).get(cfg.queryParam);
  if (initial) run(initial);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initInline);
} else {
  initInline();
}

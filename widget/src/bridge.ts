/**
 * WordPress/test-site bridge for the AI Search widget.
 *
 * Load this after ai-search-widget.js to intercept the host site's native
 * search forms and route them into the AI panel. If the panel is not available,
 * it falls back to a full inline search page such as /ai-search/?q=...
 */

interface AssistantApi {
  open: (query?: string) => void;
  search: (query: string) => void;
  close?: () => void;
}

interface BridgeConfig {
  mode: "panel" | "page";
  searchPage: string;
  queryParam: string;
  formSelector: string;
}

function currentScript(): HTMLScriptElement | null {
  return (
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>("script[data-ai-search-bridge]") ??
    document.querySelector<HTMLScriptElement>("script[src*='ai-search-bridge']")
  );
}

function readConfig(): BridgeConfig {
  const el = currentScript();
  const mode = el?.dataset.mode === "page" ? "page" : "panel";
  return {
    mode,
    searchPage: el?.dataset.searchPage || "/ai-search/",
    queryParam: el?.dataset.queryParam || "q",
    formSelector: el?.dataset.formSelector || "",
  };
}

function assistantApi(): AssistantApi | undefined {
  return (window as Window & { AISearchAssistant?: AssistantApi }).AISearchAssistant;
}

function searchUrl(cfg: BridgeConfig, query: string): string {
  const url = new URL(cfg.searchPage, window.location.href);
  url.searchParams.set(cfg.queryParam, query);
  return url.toString();
}

function candidateInput(form: HTMLFormElement): HTMLInputElement | null {
  return form.querySelector<HTMLInputElement>(
    'input[type="search"], input[name="q"], input[name="s"], input[name="search"], input.search-field'
  );
}

function isSearchForm(form: HTMLFormElement, input: HTMLInputElement, cfg: BridgeConfig): boolean {
  if (form.hasAttribute("data-ai-search-ignore")) return false;
  if (cfg.formSelector && form.matches(cfg.formSelector)) return true;

  const formText = `${form.id} ${form.className} ${form.getAttribute("role") ?? ""} ${form.getAttribute("action") ?? ""}`;
  const inputText = `${input.type} ${input.name} ${input.id} ${input.className} ${input.getAttribute("placeholder") ?? ""}`;
  return /search/i.test(`${formText} ${inputText}`) || ["q", "s", "search"].includes(input.name);
}

function runSearch(query: string, cfg: BridgeConfig) {
  const q = query.trim();
  if (!q) return;

  const assistant = assistantApi();
  if (cfg.mode !== "page" && assistant?.search) {
    assistant.search(q);
    return;
  }

  window.location.assign(searchUrl(cfg, q));
}

function initBridge() {
  const cfg = readConfig();

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const input = candidateInput(form);
      if (!input || !isSearchForm(form, input, cfg)) return;

      const q = input.value.trim();
      if (!q) return;

      event.preventDefault();
      event.stopPropagation();
      runSearch(q, cfg);
    },
    true
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter") return;
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      const form = input.form;
      if (!form || !candidateInput(form) || !isSearchForm(form, input, cfg)) return;

      const q = input.value.trim();
      if (!q) return;

      event.preventDefault();
      event.stopPropagation();
      runSearch(q, cfg);
    },
    true
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBridge);
} else {
  initBridge();
}

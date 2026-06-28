# Embeddable AI Search Scripts

This package builds three zero-dependency browser scripts that connect the
WordPress test site to the same FastAPI AI Search backend used by the Next.js
demo.

| file | purpose |
| --- | --- |
| `dist/ai-search-widget.js` | Floating search launcher and side panel with AI Overview, facets, sources, and Load more. |
| `dist/ai-search-bridge.js` | Intercepts native WordPress/search forms and routes them to AI Search. |
| `dist/ai-search-inline.js` | Full inline search experience for a WordPress `/ai-search/` page. |

## Build

```bash
npm install
npm run build
```

## Option 1: Floating widget only

```html
<script
  src="https://search.cd-web.org/ai-search-widget.js"
  data-api-base="https://search.cd-web.org"
  data-accent="#059669"
  data-title="Search"
></script>
```

The widget exposes a small global API after it loads:

```js
window.AISearchAssistant.open();
window.AISearchAssistant.search("ginseng quality testing");
window.AISearchAssistant.close();
```

## Option 2: Use the original site search box

Load the widget, then load the bridge. Existing WordPress search forms will open
the AI panel and run the query instead of navigating to the default WP search.

```html
<script
  src="https://search.cd-web.org/ai-search-widget.js"
  data-api-base="https://search.cd-web.org"
  data-title="Search"
></script>
<script
  src="https://search.cd-web.org/ai-search-bridge.js"
  data-ai-search-bridge
></script>
```

To force the original search box to navigate to a full AI Search page instead of
opening the panel:

```html
<script
  src="https://search.cd-web.org/ai-search-bridge.js"
  data-ai-search-bridge
  data-mode="page"
  data-search-page="/ai-search/"
></script>
```

## Option 3: Full inline `/ai-search/` page

Create a WordPress page at `/ai-search/` and add a Custom HTML block:

```html
<div id="ai-search-root"></div>
<script
  src="https://search.cd-web.org/ai-search-inline.js"
  data-api-base="https://search.cd-web.org"
  data-target="#ai-search-root"
  data-title="HerbSearch"
></script>
```

Then use the bridge in `data-mode="page"` across the rest of the site so native
search submissions redirect to `/ai-search/?q=...`.

## Local demos

- `index.html` demonstrates the floating panel.
- `inline.html` demonstrates the full inline page.

Both need the FastAPI backend running at `http://localhost:8000` with a built
index.

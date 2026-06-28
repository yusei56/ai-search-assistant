# Deployment Guide

## Mental model: two separate things

The test site is **WordPress (PHP)**. The backend is **Python + an ML model +
an index** — it cannot run inside WordPress. So deployment is two parts:

```
  ┌─────────────────────────────────────────────┐
  │  Your own host (1 small VPS, HTTPS)          │
  │   ├─ FastAPI backend   (retrieval + LLM)     │
  │   ├─ Next.js demo      (standalone search)   │
  │   └─ ai-search-widget.js (static)            │
  └───────────────▲─────────────────────────────┘
                  │  HTTPS + CORS
  ┌───────────────┴─────────────────────────────┐
  │  WordPress test site                         │
  │   └─ ONE <script> tag → injects the widget   │
  └─────────────────────────────────────────────┘
```

Only the `<script>` tag touches WordPress. Everything else is hosted by you and
exposed on one domain via Caddy (which also auto-issues TLS).

---

## Part 1 — Host the service (one command)

### Prerequisites
- A Linux server with **Docker + Docker Compose** (1–2 GB RAM is enough; the
  `bge-small` model + index use ~500 MB).
- A domain/subdomain (e.g. `search.cd-web.org`) with a **DNS A record pointing
  to the server** (Caddy needs this to issue the TLS certificate).
- Ports **80** and **443** open.

### Steps
```bash
git clone <repo> && cd ai-search-assistant

# 1) public domain (for TLS + the frontend build)
cp deploy/.env.example deploy/.env
#    edit: PUBLIC_DOMAIN=search.cd-web.org   PUBLIC_URL=https://search.cd-web.org

# 2) backend secrets / config
cp backend/.env.example backend/.env
#    edit: LLM_API_KEY=...            (DeepSeek/GPT-4o — enables AI Overview)
#          CORS_ORIGINS=https://test-site.141154.cd-web.org,https://search.cd-web.org

# 3) deploy
./deploy/deploy.sh
```

`deploy.sh` builds the widget bundle, builds the images, and starts everything.
Caddy provisions HTTPS automatically within ~30 s of first start.

### What happens on first boot
The backend builds the index once: it crawls the WP REST API (~93 pages) and
downloads the small embedding model (~130 MB). Watch it:
```bash
docker compose -f deploy/docker-compose.prod.yml logs -f backend
```

### Verify
```bash
curl https://search.cd-web.org/api/health        # {"status":"ok","index_loaded":true}
curl "https://search.cd-web.org/api/search?q=ginseng&limit=2"
open  https://search.cd-web.org                   # the standalone demo
open  https://search.cd-web.org/ai-search-widget.js
```

### Routing (handled by `deploy/Caddyfile`)
| Path                    | Goes to            |
| ----------------------- | ------------------ |
| `/`                     | Next.js demo       |
| `/api/*`                | FastAPI (incl. SSE)|
| `/ai-search-widget.js`  | the widget (CORS-open) |

---

## Part 2 — Embed the widget on the WordPress test site

Add this one snippet to the site (point `data-api-base` at your deployed domain):

```html
<script src="https://search.cd-web.org/ai-search-widget.js"
        data-api-base="https://search.cd-web.org"
        data-accent="#059669"
        data-title="Search"></script>
```

Pick **one** of these ways to install it:

**A. Header/Footer plugin (easiest, no code)**
Install *WPCode* or *Insert Headers and Footers* → paste the snippet into the
"Footer" box → Save. Loads site-wide.

**B. Theme (`functions.php`)**
```php
add_action('wp_footer', function () { ?>
  <script src="https://search.cd-web.org/ai-search-widget.js"
          data-api-base="https://search.cd-web.org"
          data-accent="#059669"></script>
<?php });
```

**C. Single page (quick test)**
Edit a page → add a **Custom HTML** block → paste the snippet. Loads on that
page only.

A floating **🔍 Search** button appears bottom-right; it opens a search panel
rendered inside a **Shadow DOM**, so the theme's CSS can't collide with it.

---

## Operations

**Two hard requirements** (browsers enforce these):
- The backend must be **HTTPS** — the WP site is https; an http API would be
  blocked as mixed content. (Caddy handles this.)
- `CORS_ORIGINS` must include the WP origin `https://test-site.141154.cd-web.org`
  (the widget calls the API cross-origin). The default `*` also works; restrict
  it for production.

**Refresh the index** after the site content changes:
```bash
docker compose -f deploy/docker-compose.prod.yml exec backend \
  python -m app.ingest.build_index
```
(Or schedule it via cron. The `incremental` approach can be added later.)

**Resource footprint**: backend image is CPU-only torch (~1.3 GB on disk),
~500 MB RAM at runtime. No GPU needed.

**Managed-hosting alternative**: front the Next.js app on Vercel and run the
backend container on a small VM/Render; set the frontend's `NEXT_PUBLIC_API_BASE`
and the backend's `CORS_ORIGINS` to each other's URLs. A single VPS (above) is
simpler because the torch image exceeds some free-tier image-size limits.


---

## WordPress-native search integration

The deployment now publishes three static browser scripts:

| Path | Purpose |
| --- | --- |
| `/ai-search-widget.js` | Floating AI Search panel. |
| `/ai-search-bridge.js` | Hooks the existing WordPress search form. |
| `/ai-search-inline.js` | Full inline AI Search page for `/ai-search/`. |

### A. Keep the floating panel, but connect the original search form

Add both scripts site-wide, preferably in the footer:

```html
<script src="https://search.cd-web.org/ai-search-widget.js"
        data-api-base="https://search.cd-web.org"
        data-title="Search"></script>
<script src="https://search.cd-web.org/ai-search-bridge.js"
        data-ai-search-bridge></script>
```

When a visitor submits the native WordPress search box, the bridge prevents the
default WordPress search and opens the AI panel with the query already running.

### B. Add a full `/ai-search/` page

Create a WordPress page whose slug is `ai-search`, then add a Custom HTML block:

```html
<div id="ai-search-root"></div>
<script src="https://search.cd-web.org/ai-search-inline.js"
        data-api-base="https://search.cd-web.org"
        data-target="#ai-search-root"
        data-title="HerbSearch"></script>
```

Then load the bridge site-wide in page mode:

```html
<script src="https://search.cd-web.org/ai-search-bridge.js"
        data-ai-search-bridge
        data-mode="page"
        data-search-page="/ai-search/"></script>
```

Now the original WordPress search box navigates to `/ai-search/?q=...`, and the
inline widget renders the AI Overview, filters, result cards, and Load more flow
inside the WordPress page.

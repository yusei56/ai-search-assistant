"""Fetch raw content from the test site's WordPress REST API.

The site exposes the standard `/wp-json/wp/v2/` endpoints (verified: 93 pages,
0 posts at build time). We pull full content + the fields we need to build
result cards, paging through 100-at-a-time.
"""
from __future__ import annotations

import httpx

# Only the fields we actually use — keeps payloads small.
_FIELDS = "id,title,link,excerpt,content,parent,menu_order,type"


def fetch_post_type(base_url: str, api_path: str, rest_base: str) -> list[dict]:
    """Fetch every item of one WP post type (e.g. 'pages', 'posts')."""
    items: list[dict] = []
    page = 1
    url = f"{base_url.rstrip('/')}{api_path}/{rest_base}"
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        while True:
            resp = client.get(
                url, params={"per_page": 100, "page": page, "_fields": _FIELDS}
            )
            # WP returns 400 with code 'rest_post_invalid_page_number' past the end.
            if resp.status_code == 400:
                break
            resp.raise_for_status()
            batch = resp.json()
            if not batch:
                break
            items.extend(batch)
            if len(batch) < 100:
                break
            page += 1
    return items


def fetch_all(base_url: str, api_path: str, rest_bases: list[str]) -> list[dict]:
    """Fetch and tag items across multiple post types."""
    out: list[dict] = []
    for rest_base in rest_bases:
        try:
            items = fetch_post_type(base_url, api_path, rest_base)
        except httpx.HTTPError as exc:  # one type failing shouldn't kill the build
            print(f"  ! skipping '{rest_base}': {exc}")
            continue
        for it in items:
            it["_rest_base"] = rest_base
        print(f"  fetched {len(items):>4} from /{rest_base}")
        out.extend(items)
    return out

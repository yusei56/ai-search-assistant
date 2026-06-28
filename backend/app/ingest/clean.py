"""Turn raw WP REST items into clean, structured documents.

Responsibilities:
- strip HTML to readable text (paragraph breaks preserved for chunking)
- derive a human-friendly *category* by walking the page parent hierarchy up
  to its top-level ancestor (the site's information architecture)
- pull the first inline image as a thumbnail for result cards
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass

from bs4 import BeautifulSoup

_WS = re.compile(r"[ \t ]+")
_BLANK_LINES = re.compile(r"\n{3,}")


@dataclass
class Document:
    doc_id: str          # e.g. "pages:542"
    wp_id: int
    type: str            # page | post
    title: str
    url: str
    category: str
    subcategory: str
    thumbnail: str | None
    excerpt: str
    text: str

    def as_dict(self) -> dict:
        return asdict(self)


def _strip_html(html: str, sep: str = "\n") -> str:
    if not html:
        return ""
    if "<" not in html:  # plain text — skip the parser (and its warnings)
        return _BLANK_LINES.sub("\n\n", _WS.sub(" ", html)).strip()
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(sep)
    text = _WS.sub(" ", text)
    text = "\n".join(line.strip() for line in text.splitlines())
    text = _BLANK_LINES.sub("\n\n", text)
    return text.strip()


def _first_image(html: str) -> str | None:
    if not html or "<img" not in html:
        return None
    soup = BeautifulSoup(html, "lxml")
    img = soup.find("img")
    return img.get("src") if img and img.get("src") else None


def _rendered(item: dict, key: str) -> str:
    val = item.get(key)
    if isinstance(val, dict):
        return val.get("rendered", "") or ""
    return val or ""


def _build_category_map(items: list[dict]) -> dict[int, dict]:
    """Map WP id -> {title, parent} for hierarchy walking."""
    return {
        it["id"]: {"title": _rendered(it, "title"), "parent": it.get("parent") or 0}
        for it in items
        if "id" in it
    }


def _category_for(wp_id: int, cat_map: dict[int, dict]) -> tuple[str, str]:
    """Return (category, subcategory) for a page.

    `category` = the major section, i.e. the node one level below the top-level
    root on the page's ancestry path. This collapses deep service sub-pages into
    their section (e.g. "Quality Testing of Herbal Medicines") rather than the
    single coarse root ("Services"), giving meaningful filter facets.
    `subcategory` = the immediate parent's title.
    """
    path: list[int] = []  # [page, ..., child_of_root, root]
    seen: set[int] = set()
    current = wp_id
    while current and current not in seen:
        seen.add(current)
        node = cat_map.get(current)
        if not node:
            break
        path.append(current)
        if node["parent"] == 0:
            break
        current = node["parent"]
    if not path:
        return "General", ""
    major = path[-2] if len(path) >= 2 else path[-1]   # child of root (or self)
    immediate = path[1] if len(path) >= 2 else path[0]  # immediate parent (or self)
    category = cat_map.get(major, {}).get("title", "General")
    subcategory = cat_map.get(immediate, {}).get("title", "")
    return category, subcategory


def to_documents(items: list[dict]) -> list[Document]:
    cat_map = _build_category_map([it for it in items if it.get("_rest_base") == "pages"])
    docs: list[Document] = []
    for it in items:
        wp_id = it.get("id")
        rest_base = it.get("_rest_base", "pages")
        wtype = "page" if rest_base == "pages" else "post"
        content_html = _rendered(it, "content")
        text = _strip_html(content_html)
        if not text or len(text) < 30:  # skip empty/placeholder pages
            continue
        if wtype == "page":
            category, subcategory = _category_for(wp_id, cat_map)
        else:
            category, subcategory = "Resources", ""
        excerpt = _strip_html(_rendered(it, "excerpt"), sep=" ")
        if not excerpt:
            excerpt = text[:200]
        docs.append(
            Document(
                doc_id=f"{rest_base}:{wp_id}",
                wp_id=wp_id,
                type=wtype,
                title=_strip_html(_rendered(it, "title"), sep=" "),
                url=it.get("link", ""),
                category=category or "General",
                subcategory=subcategory,
                thumbnail=_first_image(content_html),
                excerpt=excerpt[:280],
                text=text,
            )
        )
    return docs

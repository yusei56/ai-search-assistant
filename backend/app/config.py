"""Central configuration.

All values can be overridden via environment variables or a `.env` file
(see `.env.example`). The app reads this once at import time as `settings`.
"""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ root, used to resolve relative artifact paths regardless of CWD.
BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- Source site (WordPress REST API) ---
    wp_base_url: str = "https://test-site.141154.cd-web.org"
    wp_api_path: str = "/wp-json/wp/v2"
    wp_post_types: str = "pages,posts"  # comma-separated WP REST bases

    # --- Index storage ---
    index_dir: str = "data/index"

    # --- Embeddings: backend = bge-m3 | openai | hash ---
    # "bge-m3" = local sentence-transformers route. Default to the light
    # English model (reliable, no large download); set embedding_model to
    # BAAI/bge-m3 for multilingual quality. See .env.example.
    embedding_backend: str = "bge-m3"
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_base_url: str = ""   # falls back to llm_base_url when blank
    embedding_api_key: str = ""    # falls back to llm_api_key when blank

    # --- Retrieval ---
    top_k: int = 8           # contexts fed to the LLM overview
    page_size: int = 10      # result cards per page
    rrf_k: int = 60          # Reciprocal Rank Fusion constant

    # --- LLM (OpenAI-compatible: DeepSeek / GPT-4o / self-hosted gateway) ---
    llm_base_url: str = "https://api.deepseek.com/v1"
    llm_api_key: str = ""
    llm_model: str = "deepseek-chat"
    llm_temperature: float = 0.2
    llm_max_tokens: int = 700

    # --- CORS (comma-separated origins, or "*") ---
    cors_origins: str = "*"

    @property
    def index_path(self) -> Path:
        p = Path(self.index_dir)
        return p if p.is_absolute() else BASE_DIR / p

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def post_type_list(self) -> list[str]:
        return [t.strip() for t in self.wp_post_types.split(",") if t.strip()]


settings = Settings()

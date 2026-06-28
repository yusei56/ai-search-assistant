.PHONY: help install install-backend install-frontend ingest ingest-fast \
        dev-backend dev-frontend build-widget clean

PY := backend/.venv/bin/python
PIP := backend/.venv/bin/pip

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: install-backend install-frontend  ## Install everything

install-backend:  ## Create venv + install backend deps
	python3 -m venv backend/.venv
	$(PIP) install --upgrade pip
	$(PIP) install -r backend/requirements.txt

install-frontend:  ## Install frontend deps
	cd frontend && npm install

ingest:  ## Build the search index (uses .env, default bge-m3)
	cd backend && .venv/bin/python -m app.ingest.build_index

ingest-fast:  ## Build the index with the dependency-free hash backend
	cd backend && .venv/bin/python -m app.ingest.build_index --backend hash

dev-backend:  ## Run FastAPI on :8000
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

dev-frontend:  ## Run Next.js on :3000
	cd frontend && npm run dev

build-widget:  ## Bundle the embeddable widget
	cd widget && npm install && npm run build

clean:  ## Remove built index + caches
	rm -rf backend/data/index backend/**/__pycache__

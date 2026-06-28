FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/root/.cache/huggingface

# Install the CPU-only torch wheel first so sentence-transformers does NOT pull
# the multi-GB CUDA build (servers here are CPU-only). Cuts the image ~5x.
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install torch==2.5.1 --index-url https://download.pytorch.org/whl/cpu && \
    pip install -r requirements.txt

COPY app ./app
COPY query.py .

EXPOSE 8000

# Build the index on first boot if it's missing (downloads the small bge model
# once + crawls the WP site), then serve.
CMD ["sh", "-c", "test -f data/index/chunks.json || python -m app.ingest.build_index; uvicorn app.main:app --host 0.0.0.0 --port 8000"]

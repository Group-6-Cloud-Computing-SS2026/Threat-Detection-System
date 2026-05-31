# Build stage
FROM python:3.12-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 --prefix=/install -r requirements.txt

# Runtime stage
FROM python:3.12-slim

LABEL maintainer="Threat Detection System Team"
LABEL description="FastAPI backend for edge-computing threat detection"

# Create non-root user
RUN groupadd -r tds && useradd -r -g tds -d /app -s /sbin/nologin tds

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Set ownership
RUN chown -R tds:tds /app

USER tds

EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/api/v1/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]

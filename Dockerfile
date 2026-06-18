# Backend production image for ScholarHUB API.
# Runs as a non-root user and applies migrations on startup.

FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Final stage
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/app

WORKDIR $APP_HOME

# Install runtime dependencies only.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user.
RUN groupadd -r scholarhub && useradd -r -g scholarhub -d $APP_HOME scholarhub

# Copy installed Python packages from builder.
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code.
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./

# Startup script.
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

RUN chown -R scholarhub:scholarhub $APP_HOME
USER scholarhub

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

#!/bin/sh
set -e

# Apply database migrations and seed admin user.
python -m app.db.init

# Start uvicorn with production-oriented defaults.
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers ${UVICORN_WORKERS:-2} \
    --proxy-headers \
    --forwarded-allow-ips '*' \
    --access-log

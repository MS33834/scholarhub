#!/usr/bin/env bash
set -euo pipefail

# ScholarHUB backend entrypoint.
# Applies Alembic migrations, creates the admin user, then starts uvicorn.

cd "$(dirname "$0")"

echo "Running database migrations..."
alembic upgrade head

echo "Creating default admin user..."
python -m scripts.create_admin || true

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers "${UVICORN_WORKERS:-1}"

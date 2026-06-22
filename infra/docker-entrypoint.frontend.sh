#!/usr/bin/env sh
set -eu

# ScholarHUB frontend entrypoint.
# Generates runtime-config.js from container environment variables,
# then hands off to nginx.

SCHOLARHUB_API_URL="${SCHOLARHUB_API_URL:-/api}"
SCHOLARHUB_API_MODE="${SCHOLARHUB_API_MODE:-remote}"
SCHOLARHUB_ROUTER_MODE="${SCHOLARHUB_ROUTER_MODE:-browser}"
SCHOLARHUB_BASE_PATH="${SCHOLARHUB_BASE_PATH:-/}"

export SCHOLARHUB_API_URL SCHOLARHUB_API_MODE SCHOLARHUB_ROUTER_MODE SCHOLARHUB_BASE_PATH

if [ -f /usr/share/nginx/html/runtime-config.js.template ]; then
    echo "Generating runtime-config.js..."
    envsubst '$SCHOLARHUB_API_URL $SCHOLARHUB_API_MODE $SCHOLARHUB_ROUTER_MODE $SCHOLARHUB_BASE_PATH' \
        < /usr/share/nginx/html/runtime-config.js.template \
        > /usr/share/nginx/html/runtime-config.js
fi

exec "$@"

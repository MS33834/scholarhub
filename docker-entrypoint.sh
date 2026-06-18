#!/bin/sh
set -e

# Generate runtime frontend configuration from environment variables.
# This allows the same Docker image to be reused with different API URLs
# without rebuilding the bundle.
TEMPLATE="/usr/share/nginx/html/runtime-config.js.template"
OUTPUT="/usr/share/nginx/html/runtime-config.js"

if [ -f "$TEMPLATE" ]; then
  # Defaults keep the standard docker-compose.prod.yml setup working out of the box.
  : "${SCHOLARHUB_API_URL:=/api}"
  : "${SCHOLARHUB_API_MODE:=remote}"
  : "${SCHOLARHUB_ROUTER_MODE:=browser}"
  : "${SCHOLARHUB_BASE_PATH:=/}"
  export SCHOLARHUB_API_URL SCHOLARHUB_API_MODE SCHOLARHUB_ROUTER_MODE SCHOLARHUB_BASE_PATH

  envsubst < "$TEMPLATE" > "$OUTPUT"
fi

exec "$@"

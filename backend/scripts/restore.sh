#!/usr/bin/env bash
# Restore the ScholarHUB PostgreSQL database from a pg_dump SQL file.
#
# Usage:
#   ./restore.sh <path-to-dump.sql[.gz]>
#
# Environment:
#   PGHOST       PostgreSQL host (default: localhost)
#   PGPORT       PostgreSQL port (default: 5432)
#   PGUSER       PostgreSQL user (default: scholarhub)
#   PGPASSWORD   PostgreSQL password
#   PGDATABASE   PostgreSQL database name (default: scholarhub)
#
# WARNING: This drops and recreates the target database. Use with caution.

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-dump.sql[.gz]>" >&2
  exit 1
fi

DUMP_FILE="$1"
if [ ! -f "$DUMP_FILE" ]; then
  echo "Backup file not found: $DUMP_FILE" >&2
  exit 1
fi

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-scholarhub}"
PGPASSWORD="${PGPASSWORD:-}"
PGDATABASE="${PGDATABASE:-scholarhub}"

echo "[restore] Dropping and recreating database ${PGDATABASE} ..."
PGPASSWORD="$PGPASSWORD" psql \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS \"$PGDATABASE\";" \
  -c "CREATE DATABASE \"$PGDATABASE\";"

if [[ "$DUMP_FILE" == *.gz ]]; then
  echo "[restore] Restoring from compressed dump $DUMP_FILE ..."
  gunzip -c "$DUMP_FILE" | PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE"
else
  echo "[restore] Restoring from $DUMP_FILE ..."
  PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    -f "$DUMP_FILE"
fi

echo "[restore] Database ${PGDATABASE} restored successfully."

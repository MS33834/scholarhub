#!/usr/bin/env bash
# Backup the ScholarHUB PostgreSQL database.
#
# Usage:
#   ./backup.sh [backup_dir]
#
# Environment:
#   PGHOST       PostgreSQL host (default: localhost)
#   PGPORT       PostgreSQL port (default: 5432)
#   PGUSER       PostgreSQL user (default: scholarhub)
#   PGPASSWORD   PostgreSQL password
#   PGDATABASE   PostgreSQL database name (default: scholarhub)
#
# The script writes a timestamped SQL dump to backup_dir and creates/updates
# "latest.sql" as a stable symlink for automation.

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="scholarhub_${TIMESTAMP}.sql"

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-scholarhub}"
PGPASSWORD="${PGPASSWORD:-}"
PGDATABASE="${PGDATABASE:-scholarhub}"

mkdir -p "$BACKUP_DIR"

echo "[backup] Dumping ${PGDATABASE} from ${PGHOST}:${PGPORT} ..."
PGPASSWORD="$PGPASSWORD" pg_dump \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDATABASE" \
  -F p \
  -f "$BACKUP_DIR/$DUMP_FILE"

gzip "$BACKUP_DIR/$DUMP_FILE"
ln -sf "$DUMP_FILE.gz" "$BACKUP_DIR/latest.sql.gz"

echo "[backup] Created $BACKUP_DIR/$DUMP_FILE.gz"
echo "[backup] Symlink $BACKUP_DIR/latest.sql.gz -> $DUMP_FILE.gz"

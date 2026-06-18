#!/usr/bin/env bash
# Remove old ScholarHUB database backups.
#
# Usage:
#   ./cleanup.sh [backup_dir] [retention_days]
#
# Defaults:
#   backup_dir     ./backups
#   retention_days 30

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
RETENTION_DAYS="${2:-30}"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "[cleanup] Backup directory does not exist: $BACKUP_DIR"
  exit 0
fi

echo "[cleanup] Removing backups older than ${RETENTION_DAYS} days from ${BACKUP_DIR} ..."
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'scholarhub_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

echo "[cleanup] Done."

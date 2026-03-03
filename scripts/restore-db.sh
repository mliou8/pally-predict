#!/bin/bash

# Database Restore Script
# Restores a pg_dump backup to the database
# Usage: ./scripts/restore-db.sh backups/pally_predict_20260303_120000.sql.gz

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh backups/*.sql.gz 2>/dev/null || echo "  No backups found"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

echo "WARNING: This will OVERWRITE all data in the database!"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? Type 'yes' to continue: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

echo "Restoring database from $BACKUP_FILE..."

# Decompress and restore
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

echo "Restore complete!"

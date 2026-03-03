#!/bin/bash

# Database Backup Script
# Saves CSV exports of the database to the backups/ directory

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load DATABASE_URL from .env
if [ -f "$PROJECT_DIR/.env" ]; then
  DATABASE_URL=$(grep "^DATABASE_URL=" "$PROJECT_DIR/.env" | cut -d'=' -f2-)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

# Create backups directory if it doesn't exist
BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "Starting database backup..."
echo "Timestamp: $TIMESTAMP"

# Export each table as CSV
echo "Exporting users..."
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM public.users) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/users_$TIMESTAMP.csv"

echo "Exporting votes..."
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM public.votes) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/votes_$TIMESTAMP.csv"

echo "Exporting questions..."
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM public.questions) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/questions_$TIMESTAMP.csv"

# Get counts
USERS=$(wc -l < "$BACKUP_DIR/users_$TIMESTAMP.csv")
VOTES=$(wc -l < "$BACKUP_DIR/votes_$TIMESTAMP.csv")
QUESTIONS=$(wc -l < "$BACKUP_DIR/questions_$TIMESTAMP.csv")

echo ""
echo "Backup complete!"
echo "  Users: $((USERS - 1)) records"
echo "  Votes: $((VOTES - 1)) records"
echo "  Questions: $((QUESTIONS - 1)) records"
echo ""
echo "Files saved to: $BACKUP_DIR/"
ls -lh "$BACKUP_DIR"/*_$TIMESTAMP.csv

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.csv" -mtime +7 -delete 2>/dev/null || true
echo ""
echo "Cleaned up backups older than 7 days"

#!/bin/bash

# RepairFlow Backup Script
# Usage: ./scripts/backup.sh [output_dir]

set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Configuration
BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "📦 Starting backup to $BACKUP_DIR..."

# 1. Database Backup
if [[ "$DATABASE_URL" == *"mysql"* ]]; then
    echo "  MySQL detected. Dumping database..."
    # Parse generic connection string: mysql://USER:PASSWORD@HOST:PORT/DB
    # Note: Regex parsing for robustness is complex in bash, simplifying for standard format
    
    # Extract parts (simplified)
    # Removing protocol
    PROTO_RM=${DATABASE_URL#*://}
    # Extract user:pass
    USER_PASS=${PROTO_RM%%@*}
    USER=${USER_PASS%%:*}
    PASS=${USER_PASS#*:}
    # Extract host:port/db
    HOST_PORT_DB=${PROTO_RM#*@}
    HOST_PORT=${HOST_PORT_DB%%/*}
    HOST=${HOST_PORT%%:*}
    # DB name
    DB=${HOST_PORT_DB#*/}
    # Remove query params if any
    DB=${DB%%\?*}

    mysqldump -h "$HOST" -u "$USER" -p"$PASS" "$DB" > "$BACKUP_DIR/db-backup-$TIMESTAMP.sql"
    echo "  ✅ Database dumped to db-backup-$TIMESTAMP.sql"

elif [[ "$DATABASE_URL" == *"file:"* ]] || [[ -z "$DATABASE_URL" ]]; then
    echo "  SQLite detected (or default). Copying database file..."
    DB_FILE="prisma/dev.db" # Default path
    
    # Try to extract from URL if possible, otherwise assume standard
    if [[ "$DATABASE_URL" == *"file:"* ]]; then
        # remove file: prefix
        DB_PATH_FROM_URL=${DATABASE_URL#file:}
        # Resolve relative path if needed, but standard is ./prisma/dev.db
        # For simplicity, if standard file exists, use it
        if [ -f "$DB_PATH_FROM_URL" ]; then
             DB_FILE="$DB_PATH_FROM_URL"
        fi
    fi

    if [ -f "$DB_FILE" ]; then
        cp "$DB_FILE" "$BACKUP_DIR/dev.db-$TIMESTAMP"
        echo "  ✅ Database copied to dev.db-$TIMESTAMP"
    else
        echo "  ⚠️ SQLite database file not found at $DB_FILE. Skipping DB backup."
    fi
else
    echo "  ⚠️ Unknown database type in DATABASE_URL. Skipping DB backup."
fi

# 2. Uploads Backup
if [ -d "public/uploads" ]; then
    echo "  Backing up uploads directory..."
    tar -czf "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz" -C public uploads
    echo "  ✅ Uploads archived to uploads-$TIMESTAMP.tar.gz"
fi

echo "🎉 Backup complete!"
ls -lh "$BACKUP_DIR" | grep "$TIMESTAMP"

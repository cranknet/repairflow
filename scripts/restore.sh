#!/bin/bash

# RepairFlow Restore Script
# Usage: ./scripts/restore.sh <backup_file>

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file>"
    echo "Supported formats: .sql (MySQL), .db-*, .db (SQLite)"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file '$BACKUP_FILE' not found."
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "⚠️  WARNING: This will OVERWRITE the current database."
echo "   Target: $DATABASE_URL"
echo "   Backup: $BACKUP_FILE"
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Generic restore cancelled."
    exit 1
fi

# Restore logic
if [[ "$DATABASE_URL" == *"mysql"* ]]; then
    echo "MySQL restore..."
    if [[ "$BACKUP_FILE" != *".sql" ]]; then
       echo "❌ Error: MySQL requires a .sql backup file."
       exit 1
    fi

    # Extract creds (simplified logic same as backup)
    PROTO_RM=${DATABASE_URL#*://}
    USER_PASS=${PROTO_RM%%@*}
    USER=${USER_PASS%%:*}
    PASS=${USER_PASS#*:}
    HOST_PORT_DB=${PROTO_RM#*@}
    HOST_PORT=${HOST_PORT_DB%%/*}
    HOST=${HOST_PORT%%:*}
    DB=${HOST_PORT_DB#*/}
    DB=${DB%%\?*}

    mysql -h "$HOST" -u "$USER" -p"$PASS" "$DB" < "$BACKUP_FILE"
    echo "✅ MySQL database restored."

elif [[ "$DATABASE_URL" == *"file:"* ]] || [[ -z "$DATABASE_URL" ]]; then
    echo "SQLite restore..."
    TARGET_DB="prisma/dev.db"
    
    # Backup current just in case
    if [ -f "$TARGET_DB" ]; then
        mv "$TARGET_DB" "$TARGET_DB.pre-restore-$(date +%s)"
        echo "  Saved current DB to $TARGET_DB.pre-restore-..."
    fi

    cp "$BACKUP_FILE" "$TARGET_DB"
    echo "✅ SQLite database restored to $TARGET_DB"
    
    echo "Regenerating Prisma client..."
    npx prisma generate
else
    echo "❌ Unknown database type."
    exit 1
fi

echo "🎉 Restore complete. Please restart the application."

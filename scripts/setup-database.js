/**
 * Database Setup Script
 * 
 * Handles Prisma schema selection and optional database push.
 * 
 * Usage:
 *   node scripts/setup-database.js           # Select schema only
 *   node scripts/setup-database.js --push    # Select schema and push to database
 * 
 * Environment:
 *   - DATABASE_PROVIDER or DB_PROVIDER: sqlite|postgresql
 *   - Development: defaults to sqlite if not set
 *   - Production: PostgreSQL enforced (provider env vars are ignored)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const SQLITE_SCHEMA_PATH = path.join(__dirname, '../prisma/schema.sqlite.prisma');
const POSTGRES_SCHEMA_PATH = path.join(__dirname, '../prisma/schema.postgres.prisma');
const VALID_PROVIDERS = ['sqlite', 'postgresql'];
const PUSH_TIMEOUT_MS = 30000;

/**
 * Log a message with consistent prefix
 */
function log(message, level = 'info') {
    const prefix = '[Database]';
    const logFn = level === 'error' ? console.error : console.log;
    logFn(`${prefix} ${message}`);
}

/**
 * Mask sensitive parts of the database URL for logging
 */
function maskUrl(url) {
    if (!url) return 'Not set';
    return url.replace(/:([^:@]+)@/, ':****@');
}

/**
 * Determine the database provider based on environment
 */
function getProvider() {
    const isProduction = process.env.NODE_ENV === 'production';
    // Support both DATABASE_PROVIDER and DB_PROVIDER for backwards compatibility
    const configuredProvider = (process.env.DATABASE_PROVIDER || process.env.DB_PROVIDER)?.toLowerCase();

    // Production: PostgreSQL only
    if (isProduction) {
        if (configuredProvider && configuredProvider !== 'postgresql') {
            log(`WARNING: DATABASE_PROVIDER="${configuredProvider}" ignored in production. PostgreSQL enforced.`);
        }
        return 'postgresql';
    }

    // Development: Use configured provider or default to sqlite
    if (configuredProvider) {
        if (!VALID_PROVIDERS.includes(configuredProvider)) {
            log(`ERROR: Invalid DATABASE_PROVIDER="${configuredProvider}". Valid: ${VALID_PROVIDERS.join(', ')}`, 'error');
            process.exit(1);
        }
        return configuredProvider;
    }

    return 'sqlite';
}

/**
 * Validate DATABASE_URL for the selected provider
 */
function validateDatabaseUrl(provider, url) {
    if (provider !== 'postgresql') return;

    if (!url) {
        log('ERROR: DATABASE_URL is required for PostgreSQL.', 'error');
        process.exit(1);
    }

    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
        log('ERROR: DATABASE_URL is not a valid PostgreSQL connection string.', 'error');
        log(`Value: ${maskUrl(url)}`, 'error');
        process.exit(1);
    }
}

/**
 * Copy the appropriate schema file
 */
function selectSchema(provider) {
    const sourcePath = provider === 'postgresql' ? POSTGRES_SCHEMA_PATH : SQLITE_SCHEMA_PATH;
    const fileName = path.basename(sourcePath);

    if (!fs.existsSync(sourcePath)) {
        log(`ERROR: Schema file not found: ${fileName}`, 'error');
        process.exit(1);
    }

    fs.copyFileSync(sourcePath, SCHEMA_PATH);
    log(`Schema: ${fileName} → schema.prisma`);
}

/**
 * Push schema to database (PostgreSQL only)
 */
function pushSchema(databaseUrl) {
    // Skip for SQLite (file-based, no push needed)
    if (!databaseUrl || databaseUrl.startsWith('file:')) {
        log('Skipping push (SQLite or no DATABASE_URL).');
        return;
    }

    log('Pushing schema to database...');

    try {
        execSync('npx prisma db push --skip-generate --accept-data-loss', {
            stdio: 'inherit',
            timeout: PUSH_TIMEOUT_MS,
            env: process.env,
        });
        log('Schema push completed.');
    } catch (error) {
        if (error.killed) {
            log('ERROR: Push timed out after 30s.', 'error');
        } else {
            log(`ERROR: Push failed (exit code ${error.status || 'unknown'}).`, 'error');
        }
        process.exit(1);
    }
}

/**
 * Main entry point
 */
function main() {
    const args = process.argv.slice(2);
    const shouldPush = args.includes('--push');

    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const databaseUrl = process.env.DATABASE_URL || '';
        const provider = getProvider();

        // Log environment
        log(`Environment: ${isProduction ? 'production' : 'development'}`);
        log(`Provider: ${provider === 'postgresql' ? 'PostgreSQL' : 'SQLite'}`);
        if (provider === 'postgresql') {
            log(`DATABASE_URL: ${maskUrl(databaseUrl)}`);
        }

        // Validate and select schema
        validateDatabaseUrl(provider, databaseUrl);
        selectSchema(provider);

        // Push if requested
        if (shouldPush) {
            pushSchema(databaseUrl);
        }

        log('Setup completed successfully.');
    } catch (error) {
        log(`ERROR: ${error.message}`, 'error');
        process.exit(1);
    }
}

main();

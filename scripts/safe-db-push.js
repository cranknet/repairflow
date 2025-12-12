/**
 * Simple database schema push script for Vercel builds
 * Runs prisma db push with timeout to prevent build hangs
 */

const { execSync } = require('child_process');

const TIMEOUT_MS = 30000; // 30 second timeout

function main() {
    const databaseUrl = process.env.DATABASE_URL;

    // Skip if no DATABASE_URL
    if (!databaseUrl) {
        console.log('[DB Setup] No DATABASE_URL set, skipping schema push');
        return;
    }

    // Skip for SQLite (local development)
    if (databaseUrl.startsWith('file:')) {
        console.log('[DB Setup] SQLite detected, skipping schema push (local dev)');
        return;
    }

    console.log('[DB Setup] Pushing database schema...');

    try {
        execSync('npx prisma db push --skip-generate --accept-data-loss', {
            stdio: 'inherit',
            timeout: TIMEOUT_MS,
            env: process.env
        });
        console.log('[DB Setup] Schema push completed successfully!');
    } catch (error) {
        if (error.killed) {
            console.log('[DB Setup] Schema push timed out after 30s - database may already be set up');
        } else {
            console.log('[DB Setup] Schema push failed:', error.message);
            console.log('[DB Setup] Continuing anyway - app will show specific errors if needed');
        }
        // Don't fail the build - let the app handle database errors gracefully
    }
}

main();

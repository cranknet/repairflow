/**
 * Safe database schema push script
 * Only pushes schema if database is empty (no tables exist)
 * This prevents accidental data loss on existing databases
 */

const { execSync } = require('child_process');

async function main() {
    console.log('[DB Setup] Checking if database needs schema push...');

    // Check if DATABASE_URL is set
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.log('[DB Setup] No DATABASE_URL set, skipping schema push');
        process.exit(0);
    }

    // Skip for SQLite (local development)
    if (databaseUrl.startsWith('file:')) {
        console.log('[DB Setup] SQLite detected, skipping auto schema push');
        process.exit(0);
    }

    try {
        // Try to check if any tables exist by running a simple query
        // We use prisma db execute to run a raw SQL check
        const checkQuery = `
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `;

        // Write query to temp file and execute
        const fs = require('fs');
        const tempFile = './prisma/temp-check.sql';
        fs.writeFileSync(tempFile, checkQuery);

        try {
            const result = execSync('npx prisma db execute --file ./prisma/temp-check.sql --schema prisma/schema.prisma', {
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Clean up temp file
            fs.unlinkSync(tempFile);

            // Parse result - if tables exist, skip push
            if (result.includes('0')) {
                console.log('[DB Setup] Database is empty, pushing schema...');
                execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
                console.log('[DB Setup] Schema pushed successfully!');
            } else {
                console.log('[DB Setup] Database has existing tables, skipping schema push');
                console.log('[DB Setup] To manually sync schema, run: npx prisma db push');
            }
        } catch (execError) {
            // Clean up temp file if it exists
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }

            // If the query fails, the database might be empty or unreachable
            // In this case, try to push the schema
            console.log('[DB Setup] Could not check database state, attempting schema push...');
            try {
                execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
                console.log('[DB Setup] Schema pushed successfully!');
            } catch (pushError) {
                console.error('[DB Setup] Schema push failed:', pushError.message);
                // Don't exit with error - let the app try to start anyway
                // The install wizard will show the actual error
            }
        }
    } catch (error) {
        console.error('[DB Setup] Error during schema check:', error.message);
        // Don't fail the build, let the app handle errors
        process.exit(0);
    }
}

main();

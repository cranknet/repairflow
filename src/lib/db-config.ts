import 'server-only';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export type DbProvider = 'postgresql' | 'mysql';

export interface DbConfig {
    provider: DbProvider;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}

export interface DbConnectionResult {
    success: boolean;
    error?: string;
    version?: string;
}

/**
 * Build a database URL from config
 */
export function buildDatabaseUrl(config: DbConfig): string {
    const { provider, host, port, database, username, password } = config;
    const encodedPassword = encodeURIComponent(password);

    if (provider === 'postgresql') {
        return `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}?schema=public`;
    } else {
        return `mysql://${username}:${encodedPassword}@${host}:${port}/${database}`;
    }
}

/**
 * Get current database configuration from environment
 */
export function getCurrentDbConfig(): { provider: DbProvider; url: string } | null {
    const provider = (process.env.DB_PROVIDER as DbProvider) || 'postgresql';
    const url = process.env.DATABASE_URL;

    if (!url) {
        return null;
    }

    return { provider, url };
}

/**
 * Test database connection using native drivers
 */
export async function testDbConnection(config: DbConfig): Promise<DbConnectionResult> {
    const url = buildDatabaseUrl(config);

    try {
        if (config.provider === 'postgresql') {
            // Use pg module
            const { Client } = await import('pg');
            const client = new Client({ connectionString: url });

            await client.connect();
            const result = await client.query('SELECT version()');
            await client.end();

            return {
                success: true,
                version: result.rows[0]?.version || 'PostgreSQL',
            };
        } else {
            // Use mysql2 module
            const mysql = await import('mysql2/promise');
            const connection = await mysql.createConnection(url);

            const [rows] = await connection.query('SELECT VERSION() as version');
            await connection.end();

            const version = Array.isArray(rows) && rows[0]
                ? (rows[0] as { version: string }).version
                : 'MySQL';

            return {
                success: true,
                version: `MySQL ${version}`,
            };
        }
    } catch (error) {
        console.error('Database connection test failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Connection failed',
        };
    }
}

/**
 * Copy the appropriate schema file to prisma/schema.prisma
 */
export async function copySchemaFile(provider: DbProvider): Promise<void> {
    const projectRoot = process.cwd();
    const sourceSchema = path.join(projectRoot, 'prisma', 'schemas', `schema-${provider}.prisma`);
    const targetSchema = path.join(projectRoot, 'prisma', 'schema.prisma');

    if (!fs.existsSync(sourceSchema)) {
        throw new Error(`Schema file not found: ${sourceSchema}`);
    }

    fs.copyFileSync(sourceSchema, targetSchema);
    console.log(`Copied ${provider} schema to prisma/schema.prisma`);
}

/**
 * Write database configuration to .env file
 */
export async function writeEnvConfig(config: DbConfig): Promise<void> {
    const projectRoot = process.cwd();
    const envPath = path.join(projectRoot, '.env');
    const url = buildDatabaseUrl(config);

    let envContent = '';

    // Read existing .env if it exists
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Update or add DB_PROVIDER
    if (envContent.includes('DB_PROVIDER=')) {
        envContent = envContent.replace(/DB_PROVIDER=.*/g, `DB_PROVIDER=${config.provider}`);
    } else {
        envContent = `DB_PROVIDER=${config.provider}\n` + envContent;
    }

    // Update or add DATABASE_URL
    if (envContent.includes('DATABASE_URL=')) {
        envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${url}"`);
    } else {
        envContent = envContent.replace(
            /DB_PROVIDER=.*/,
            `DB_PROVIDER=${config.provider}\nDATABASE_URL="${url}"`
        );
    }

    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env with database configuration');

    // Also update process.env for immediate use
    process.env.DB_PROVIDER = config.provider;
    process.env.DATABASE_URL = url;
}

/**
 * Run Prisma generate to create the client
 */
export async function runPrismaGenerate(): Promise<{ success: boolean; output: string; error?: string }> {
    try {
        const { stdout, stderr } = await execAsync('npx prisma generate', {
            cwd: process.cwd(),
            env: { ...process.env },
        });

        console.log('Prisma generate output:', stdout);
        if (stderr) console.error('Prisma generate stderr:', stderr);

        return { success: true, output: stdout };
    } catch (error) {
        console.error('Prisma generate failed:', error);
        return {
            success: false,
            output: '',
            error: error instanceof Error ? error.message : 'Prisma generate failed',
        };
    }
}

/**
 * Run Prisma db push to create/update tables
 */
export async function runPrismaDbPush(): Promise<{ success: boolean; output: string; error?: string }> {
    try {
        const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
            cwd: process.cwd(),
            env: { ...process.env },
        });

        console.log('Prisma db push output:', stdout);
        if (stderr) console.error('Prisma db push stderr:', stderr);

        return { success: true, output: stdout };
    } catch (error) {
        console.error('Prisma db push failed:', error);
        return {
            success: false,
            output: '',
            error: error instanceof Error ? error.message : 'Prisma db push failed',
        };
    }
}

/**
 * Initialize database with the given configuration
 * This is the main entry point for database setup
 */
export async function initializeDatabase(config: DbConfig): Promise<{
    success: boolean;
    steps: { name: string; success: boolean; error?: string }[];
}> {
    const steps: { name: string; success: boolean; error?: string }[] = [];

    // Step 1: Test connection
    console.log('Step 1: Testing database connection...');
    const connectionResult = await testDbConnection(config);
    steps.push({
        name: 'Test Connection',
        success: connectionResult.success,
        error: connectionResult.error,
    });

    if (!connectionResult.success) {
        return { success: false, steps };
    }

    // Step 2: Copy schema file
    console.log('Step 2: Copying schema file...');
    try {
        await copySchemaFile(config.provider);
        steps.push({ name: 'Copy Schema', success: true });
    } catch (error) {
        steps.push({
            name: 'Copy Schema',
            success: false,
            error: error instanceof Error ? error.message : 'Failed to copy schema',
        });
        return { success: false, steps };
    }

    // Step 3: Write .env configuration
    console.log('Step 3: Writing environment configuration...');
    try {
        await writeEnvConfig(config);
        steps.push({ name: 'Write Config', success: true });
    } catch (error) {
        steps.push({
            name: 'Write Config',
            success: false,
            error: error instanceof Error ? error.message : 'Failed to write config',
        });
        return { success: false, steps };
    }

    // Step 4: Run Prisma generate
    console.log('Step 4: Running Prisma generate...');
    const generateResult = await runPrismaGenerate();
    steps.push({
        name: 'Prisma Generate',
        success: generateResult.success,
        error: generateResult.error,
    });

    if (!generateResult.success) {
        return { success: false, steps };
    }

    // Step 5: Run Prisma db push
    console.log('Step 5: Running Prisma db push...');
    const pushResult = await runPrismaDbPush();
    steps.push({
        name: 'Create Tables',
        success: pushResult.success,
        error: pushResult.error,
    });

    return {
        success: pushResult.success,
        steps,
    };
}

/**
 * Export all data from current database
 */
export async function exportDatabaseData(): Promise<Record<string, unknown[]>> {
    // Dynamic import to avoid issues during initial setup
    const { prisma } = await import('./prisma');

    const data: Record<string, unknown[]> = {};

    // Export all tables in order (respecting foreign key dependencies)
    const tables = [
        'user',
        'customer',
        'supplier',
        'part',
        'ticket',
        'ticketStatusHistory',
        'ticketPart',
        'ticketPriceAdjustment',
        'inventoryTransaction',
        'return',
        'notification',
        'notificationPreference',
        'payment',
        'contactMessage',
        'satisfactionRating',
        'settings',
        'loginLog',
        'passwordResetToken',
        'smsTemplate',
        'emailSettings',
        'expense',
        'inventoryAdjustment',
        'journalEntry',
        'receiptScan',
        'chat',
        'chatParticipant',
        'chatMessage',
        'chatReaction',
    ];

    for (const table of tables) {
        try {
            // @ts-expect-error - Dynamic table access
            data[table] = await prisma[table].findMany();
        } catch (error) {
            console.warn(`Failed to export table ${table}:`, error);
            data[table] = [];
        }
    }

    return data;
}

/**
 * Import data into current database
 */
export async function importDatabaseData(data: Record<string, unknown[]>): Promise<{
    success: boolean;
    imported: string[];
    failed: string[];
}> {
    // Dynamic import to avoid issues during initial setup
    const { prisma } = await import('./prisma');

    const imported: string[] = [];
    const failed: string[] = [];

    // Import in order (respecting foreign key dependencies)
    const tables = [
        'user',
        'customer',
        'supplier',
        'part',
        'ticket',
        'ticketStatusHistory',
        'ticketPart',
        'ticketPriceAdjustment',
        'inventoryTransaction',
        'return',
        'notification',
        'notificationPreference',
        'payment',
        'contactMessage',
        'satisfactionRating',
        'settings',
        'loginLog',
        'passwordResetToken',
        'smsTemplate',
        'emailSettings',
        'expense',
        'inventoryAdjustment',
        'journalEntry',
        'receiptScan',
        'chat',
        'chatParticipant',
        'chatMessage',
        'chatReaction',
    ];

    for (const table of tables) {
        if (!data[table] || !Array.isArray(data[table]) || data[table].length === 0) {
            continue;
        }

        try {
            // @ts-expect-error - Dynamic table access
            await prisma[table].createMany({
                data: data[table],
                skipDuplicates: true,
            });
            imported.push(table);
        } catch (error) {
            console.error(`Failed to import table ${table}:`, error);
            failed.push(table);
        }
    }

    return { success: failed.length === 0, imported, failed };
}

import 'server-only';

/**
 * Check if the database is configured (DATABASE_URL is set and valid)
 */
export function isDatabaseConfigured(): boolean {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        return false;
    }

    // Check if it's a placeholder or empty value
    if (
        databaseUrl === '' ||
        databaseUrl.includes('user:password') ||
        databaseUrl.includes('username:password') ||
        databaseUrl === 'postgresql://user:password@localhost:5432/repairflow?schema=public'
    ) {
        return false;
    }

    return true;
}

/**
 * Check if a Prisma error is a connection-related error
 */
function isConnectionError(error: unknown): boolean {
    if (error && typeof error === 'object') {
        const e = error as { code?: string; message?: string };
        return (
            e.code === 'ECONNREFUSED' ||
            e.code === 'ENOTFOUND' ||
            e.code === 'ENOENT' ||
            e.code === 'P1001' || // Can't reach database server
            e.code === 'P1002' || // Database server timeout
            (e.message?.includes('ECONNREFUSED') ?? false) ||
            (e.message?.includes('connect ETIMEDOUT') ?? false) ||
            (e.message?.includes('Connection refused') ?? false) ||
            (e.message?.includes('pool timeout') ?? false)
        );
    }
    return false;
}

/**
 * Check if the app is installed by querying the database
 * Returns false if database is not configured or query fails
 */
export async function isAppInstalled(): Promise<boolean> {
    // If database isn't configured, definitely not installed
    if (!isDatabaseConfigured()) {
        return false;
    }

    try {
        // Dynamic import to avoid issues when DB isn't configured
        const { prisma } = await import('./prisma');

        const isInstalledSetting = await prisma.settings.findUnique({
            where: { key: 'is_installed' },
        });

        return isInstalledSetting?.value === 'true';
    } catch (error) {
        // Only log non-connection errors (connection errors are expected during install)
        if (!isConnectionError(error)) {
            console.error('Failed to check installation status:', error);
        }
        return false;
    }
}

/**
 * Check if we should redirect to install wizard
 */
export function shouldShowInstallWizard(): boolean {
    return !isDatabaseConfigured();
}

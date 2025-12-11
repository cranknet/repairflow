import 'server-only';

/**
 * Check if the database is configured (DATABASE_URL is set)
 * For SQLite, we just check if the URL is a file path
 */
export function isDatabaseConfigured(): boolean {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        return false;
    }

    // SQLite file-based URL is always considered configured
    if (databaseUrl.startsWith('file:')) {
        return true;
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
            e.code === 'ENOENT' ||
            e.code === 'P1001' || // Can't reach database server
            e.code === 'P1002' || // Database server timeout
            (e.message?.includes('database') ?? false) ||
            (e.message?.includes('SQLITE') ?? false)
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

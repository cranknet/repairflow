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
        console.error('Failed to check installation status:', error);
        return false;
    }
}

/**
 * Check if we should redirect to install wizard
 */
export function shouldShowInstallWizard(): boolean {
    return !isDatabaseConfigured();
}

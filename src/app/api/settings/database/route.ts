import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Read current configuration (read-only, safe)
        const databaseUrl = process.env.DATABASE_URL || '';

        let config: any = {
            type: 'sqlite' as 'sqlite' | 'mysql',
        };

        if (databaseUrl.startsWith('mysql://')) {
            // Parse MySQL URL
            const url = new URL(databaseUrl);
            config = {
                type: 'mysql',
                host: url.hostname,
                port: parseInt(url.port) || 3306,
                database: url.pathname.slice(1),
                user: url.username,
                password: '', // Don't send password to client
            };
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error loading database config:', error);
        return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
    }
}

// SECURITY FIX: POST endpoint disabled - writing database credentials to .env is insecure
// Database configuration should be managed via:
// 1. Deployment platform environment variables (Vercel, Railway, etc.)
// 2. Encrypted secrets manager (AWS Secrets Manager, Vault, etc.)
// 3. Manual .env file configuration (not accessible to the application)
//
// Writing passwords to plaintext files accessible by the application creates security risks:
// - Credentials visible in filesystem
// - No encryption of sensitive data
// - Potential file permission issues
// - Credentials may be logged or backed up

export async function POST(request: NextRequest) {
    return NextResponse.json(
        {
            error: 'Database configuration via API is disabled for security reasons.',
            message: 'Please configure DATABASE_URL via environment variables in your deployment platform or .env file manually.',
            documentation: 'https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables'
        },
        { status: 403 }
    );
}

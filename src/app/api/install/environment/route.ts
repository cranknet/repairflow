import { NextResponse } from 'next/server';
import type { EnvCheckResult } from '@/app/(setup)/install/lib/validation';

/**
 * GET /api/install/environment
 * Check required environment variables
 */
export async function GET() {
    const checks: EnvCheckResult[] = [];

    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    checks.push({
        key: 'DATABASE_URL',
        label: 'Database URL',
        status: databaseUrl ? 'ok' : 'error',
        required: true,
        message: databaseUrl ? 'Configured' : 'DATABASE_URL is required',
    });

    // Check AUTH_SECRET / NEXTAUTH_SECRET
    const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    checks.push({
        key: 'AUTH_SECRET',
        label: 'Auth Secret',
        status: authSecret ? 'ok' : 'error',
        required: true,
        message: authSecret ? 'Configured' : 'AUTH_SECRET or NEXTAUTH_SECRET is required',
    });

    // Check SMTP configuration (optional)
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpConfigured = smtpHost && smtpUser;
    checks.push({
        key: 'SMTP_CONFIG',
        label: 'SMTP Configuration',
        status: smtpConfigured ? 'ok' : 'warning',
        required: false,
        message: smtpConfigured
            ? 'Email sending configured'
            : 'Email features will be limited without SMTP configuration',
    });

    // Check EMAIL_ENCRYPTION_KEY (optional, for secure SMTP storage)
    const emailKey = process.env.EMAIL_ENCRYPTION_KEY;
    checks.push({
        key: 'EMAIL_ENCRYPTION_KEY',
        label: 'Email Encryption Key',
        status: emailKey ? 'ok' : 'warning',
        required: false,
        message: emailKey
            ? 'Configured for secure password storage'
            : 'Optional: Run npm run generate-email-key for secure SMTP storage',
    });

    const hasErrors = checks.some(c => c.status === 'error');
    const hasWarnings = checks.some(c => c.status === 'warning');

    return NextResponse.json({
        checks,
        hasErrors,
        hasWarnings,
        canProceed: !hasErrors,
    });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { testSMTPConnection, type EmailConfig } from '@/lib/email';
import { z } from 'zod';

const emailSettingsSchema = z.object({
    smtpHost: z.string().min(1, 'SMTP host is required'),
    smtpPort: z.coerce.number().int().min(1).max(65535),
    smtpSecure: z.boolean(),
    smtpUser: z.string().email('Valid email required'),
    smtpPassword: z.string().min(1, 'Password is required'),
    fromEmail: z.string().email('Valid email required'),
    fromName: z.string().min(1, 'From name is required'),
    replyToEmail: z.string().email().optional().or(z.literal(''))
});

type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;

/**
 * GET /api/settings/email
 * Retrieve current email settings (admin only)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 401 }
            );
        }

        const settings = await prisma.emailSettings.findFirst({
            where: { isActive: true }
        });

        if (!settings) {
            return NextResponse.json({
                configured: false,
                usingDefaults: true
            });
        }

        return NextResponse.json({
            configured: true,
            settings: {
                ...settings,
                smtpPassword: '********' // Never send password to client
            }
        });
    } catch (error) {
        console.error('Error fetching email settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch email settings' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/settings/email
 * Save or update email settings (admin only)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validated = emailSettingsSchema.parse(body);

        // Test connection first
        const testConfig: EmailConfig = {
            host: validated.smtpHost,
            port: validated.smtpPort,
            secure: validated.smtpSecure,
            user: validated.smtpUser,
            password: validated.smtpPassword,
            from: validated.fromEmail,
            fromName: validated.fromName,
            replyTo: validated.replyToEmail || undefined
        };

        const testResult = await testSMTPConnection(testConfig);

        if (!testResult) {
            return NextResponse.json(
                { error: 'SMTP connection test failed. Please check your settings and try again.' },
                { status: 400 }
            );
        }

        // Encrypt password
        const encryptedPassword = encrypt(validated.smtpPassword);

        // Deactivate existing settings
        await prisma.emailSettings.updateMany({
            where: { isActive: true },
            data: { isActive: false }
        });

        // Create new settings
        const settings = await prisma.emailSettings.create({
            data: {
                smtpHost: validated.smtpHost,
                smtpPort: validated.smtpPort,
                smtpSecure: validated.smtpSecure,
                smtpUser: validated.smtpUser,
                smtpPassword: encryptedPassword,
                fromEmail: validated.fromEmail,
                fromName: validated.fromName,
                replyToEmail: validated.replyToEmail || null,
                isVerified: true,
                lastTestedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            settings: {
                ...settings,
                smtpPassword: '********'
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error saving email settings:', error);
        return NextResponse.json(
            { error: 'Failed to save email settings' },
            { status: 500 }
        );
    }
}

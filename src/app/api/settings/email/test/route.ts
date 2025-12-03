import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { getSMTPTestEmailTemplate } from '@/lib/email-templates/smtp-test';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/settings/email/test
 * Send a test email to verify SMTP configuration (admin only)
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
        const { testEmail } = body;

        // Use session user's email if no test email provided
        const recipientEmail = testEmail || session.user.email;

        if (!recipientEmail) {
            return NextResponse.json(
                { error: 'No email address provided' },
                { status: 400 }
            );
        }

        // Get company name from settings
        let companyName = 'RepairFlow';
        try {
            const companyNameSetting = await prisma.settings.findUnique({
                where: { key: 'COMPANY_NAME' }
            });
            if (companyNameSetting) {
                companyName = companyNameSetting.value;
            }
        } catch (error) {
            console.warn('Could not fetch company name:', error);
        }

        // Generate test email HTML
        const html = getSMTPTestEmailTemplate({
            companyName,
            testTime: new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            })
        });

        // Send test email
        await sendEmail({
            to: recipientEmail,
            subject: `SMTP Test Email - ${companyName}`,
            html
        });

        // Update lastTestedAt timestamp
        await prisma.emailSettings.updateMany({
            where: { isActive: true },
            data: { lastTestedAt: new Date() }
        });

        return NextResponse.json({
            success: true,
            message: `Test email sent successfully to ${recipientEmail}`
        });
    } catch (error: any) {
        console.error('Error sending test email:', error);
        return NextResponse.json(
            {
                error: 'Failed to send test email',
                details: error.message
            },
            { status: 500 }
        );
    }
}

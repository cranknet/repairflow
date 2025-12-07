import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        // Fetch all data from database
        const [
            settings,
            customers,
            suppliers,
            parts,
            tickets,
            payments,
            returns,
            expenses,
            smsTemplates,
            emailSettings,
            notificationPreferences,
            users,
        ] = await Promise.all([
            prisma.settings.findMany(),
            prisma.customer.findMany(),
            prisma.supplier.findMany(),
            prisma.part.findMany(),
            prisma.ticket.findMany({
                include: {
                    parts: true,
                },
            }),
            prisma.payment.findMany(),
            prisma.return.findMany(),
            prisma.expense.findMany(),
            prisma.sMSTemplate.findMany(),
            prisma.emailSettings.findMany(),
            prisma.notificationPreference.findMany(),
            // Don't export passwords, only usernames and emails for reference
            prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        const backup = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            exportedBy: session.user.username,
            data: {
                settings,
                customers,
                suppliers,
                parts,
                tickets,
                payments,
                returns,
                expenses,
                smsTemplates,
                emailSettings,
                notificationPreferences,
                users,
            },
        };

        const jsonString = JSON.stringify(backup, null, 2);

        return new NextResponse(jsonString, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename=repairflow-backup-${new Date().toISOString().split('T')[0]}.json`,
            },
        });
    } catch (error) {
        console.error('Database export error:', error);
        return NextResponse.json(
            { error: 'Failed to export database' },
            { status: 500 }
        );
    }
}

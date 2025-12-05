import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        // Only allow admin users to perform factory reset
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized. Only administrators can reset the system.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { confirmation } = body;

        // Require explicit confirmation
        if (confirmation !== 'RESET') {
            return NextResponse.json(
                { error: 'Confirmation required. Please type RESET to confirm.' },
                { status: 400 }
            );
        }

        // Delete all data in the correct order (respecting foreign keys)
        // Start with most dependent models first, then work up to parent models
        await prisma.$transaction([
            // 1. Finance module - most dependent models first
            prisma.journalEntry.deleteMany({}),
            prisma.return.deleteMany({}),
            prisma.payment.deleteMany({}),
            prisma.expense.deleteMany({}),
            prisma.inventoryAdjustment.deleteMany({}),

            // 2. User-dependent models
            prisma.notificationPreference.deleteMany({}),
            prisma.loginLog.deleteMany({}),
            prisma.passwordResetToken.deleteMany({}),

            // 3. Ticket-dependent models
            prisma.ticketPriceAdjustment.deleteMany({}),
            prisma.ticketPart.deleteMany({}),
            prisma.ticketStatusHistory.deleteMany({}),
            prisma.satisfactionRating.deleteMany({}),
            prisma.contactMessage.deleteMany({}),
            prisma.notification.deleteMany({}),

            // 4. Ticket and inventory transactions
            prisma.inventoryTransaction.deleteMany({}),
            prisma.ticket.deleteMany({}),

            // 5. Customer and parts
            prisma.customer.deleteMany({}),
            prisma.part.deleteMany({}),
            prisma.supplier.deleteMany({}),

            // 6. Settings and templates
            prisma.sMSTemplate.deleteMany({}),
            prisma.emailSettings.deleteMany({}),

            // 7. Delete all users (after all dependent records)
            prisma.user.deleteMany({}),

            // 8. Delete all settings (last)
            prisma.settings.deleteMany({}),
        ]);

        return NextResponse.json({
            success: true,
            message: 'System has been reset to factory defaults. Redirecting to installation page...',
        });
    } catch (error) {
        console.error('Factory reset error:', error);
        return NextResponse.json(
            { error: 'Failed to reset system. Please check server logs.' },
            { status: 500 }
        );
    }
}

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
        // Start with dependent tables first
        await prisma.$transaction([
            // Delete login logs
            prisma.loginLog.deleteMany({}),

            // Delete returns
            prisma.return.deleteMany({}),

            // Delete ticket parts
            prisma.ticketPart.deleteMany({}),

            // Delete SMS templates
            prisma.sMSTemplate.deleteMany({}),

            // Delete tickets
            prisma.ticket.deleteMany({}),

            // Delete customers
            prisma.customer.deleteMany({}),

            // Delete inventory parts
            prisma.part.deleteMany({}),

            // Delete all users
            prisma.user.deleteMany({}),

            // Delete all settings
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

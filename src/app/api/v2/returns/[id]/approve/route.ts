import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin-only check for approving returns
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only administrators can approve returns' },
                { status: 403 }
            );
        }

        const { id } = await params;

        const returnRecord = await prisma.return.findUnique({
            where: { id },
            include: {
                ticket: {
                    select: {
                        ticketNumber: true,
                        status: true,
                    },
                },
            },
        });

        if (!returnRecord) {
            return NextResponse.json({ error: 'Return not found' }, { status: 404 });
        }

        // Check if already approved
        if (returnRecord.status === 'APPROVED') {
            return NextResponse.json(
                { error: 'Return is already approved' },
                { status: 400 }
            );
        }

        // Update return status to APPROVED
        const updatedReturn = await prisma.return.update({
            where: { id },
            data: {
                status: 'APPROVED',
                handledAt: new Date(),
                handledBy: session.user.id,
            },
            include: {
                ticket: {
                    select: {
                        ticketNumber: true,
                        customer: {
                            select: {
                                name: true,
                                phone: true,
                            },
                        },
                    },
                },
                createdByUser: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
                handledByUser: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        // Change ticket status to RETURNED
        await prisma.ticket.update({
            where: { id: returnRecord.ticketId },
            data: {
                status: 'RETURNED',
                statusHistory: {
                    create: {
                        status: 'RETURNED',
                        notes: `Return approved. Refund amount: ${returnRecord.refundAmount}. Ticket status changed to RETURNED.`,
                        changedById: session.user.id,
                    },
                },
            },
        });

        return NextResponse.json(updatedReturn);
    } catch (error) {
        console.error('Error approving return:', error);
        return NextResponse.json(
            { error: 'Failed to approve return' },
            { status: 500 }
        );
    }
}

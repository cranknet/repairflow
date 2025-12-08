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

        // Admin-only check for rejecting returns
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only administrators can reject returns' },
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

        // Check if already approved or rejected
        if (returnRecord.status === 'REJECTED') {
            return NextResponse.json(
                { error: 'Return is already rejected' },
                { status: 400 }
            );
        }

        if (returnRecord.status === 'APPROVED') {
            return NextResponse.json(
                { error: 'Cannot reject an approved return' },
                { status: 400 }
            );
        }

        // Update return status to REJECTED
        const updatedReturn = await prisma.return.update({
            where: { id },
            data: {
                status: 'REJECTED',
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

        // Add status history note that return was rejected
        await prisma.ticketStatusHistory.create({
            data: {
                ticketId: returnRecord.ticketId,
                status: returnRecord.ticket.status,
                notes: `Return rejected. Ticket remains ${returnRecord.ticket.status}.`,
                changedById: session.user.id,
            },
        });

        return NextResponse.json(updatedReturn);
    } catch (error) {
        console.error('Error rejecting return:', error);
        return NextResponse.json(
            { error: 'Failed to reject return' },
            { status: 500 }
        );
    }
}

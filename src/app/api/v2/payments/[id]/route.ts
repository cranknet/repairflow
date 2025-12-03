/**
 * API Route: GET /api/v2/payments/[id]
 * Get payment details with related entities
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin-only check
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only administrators can view payment details' },
                { status: 403 }
            );
        }

        const { id } = await params;

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                ticket: {
                    include: {
                        customer: true,
                    },
                },
                performedByUser: {
                    select: {
                        name: true,
                        username: true,
                        email: true,
                    },
                },
                refundReturns: {
                    include: {
                        ticket: {
                            select: {
                                ticketNumber: true,
                            },
                        },
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Get related journal entries
        const journalEntries = await prisma.journalEntry.findMany({
            where: {
                referenceType: 'PAYMENT',
                referenceId: id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                createdByUser: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        return NextResponse.json({
            payment,
            journalEntries,
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payment' },
            { status: 500 }
        );
    }
}

/**
 * API Route: GET /api/v2/payments
 * Fetches paginated payments with search and filter support
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const method = searchParams.get('method') || '';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            ticket: {
                deletedAt: null, // Exclude soft-deleted tickets
            },
        };

        if (method) {
            where.method = method;
        }

        if (search) {
            where.OR = [
                { paymentNumber: { contains: search } },
                { ticket: { ticketNumber: { contains: search } } },
                { ticket: { customer: { name: { contains: search } } } },
                { ticket: { customer: { phone: { contains: search } } } },
                { performedByUser: { name: { contains: search } } },
                { performedByUser: { username: { contains: search } } },
            ];
        }

        // Fetch payments with pagination
        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
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
                    performedByUser: {
                        select: {
                            name: true,
                            username: true,
                        },
                    },
                },
            }),
            prisma.payment.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payments' },
            { status: 500 }
        );
    }
}

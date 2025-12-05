/**
 * API Route: GET /api/v2/payments
 * List and filter payments with pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin-only check
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only administrators can view payments' },
                { status: 403 }
            );
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '25');
        const ticketId = searchParams.get('ticketId');
        const method = searchParams.get('method');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const userId = searchParams.get('userId');
        const search = searchParams.get('search');

        // Build where clause
        const where: any = {};

        if (ticketId) {
            where.ticketId = ticketId;
        }

        if (method) {
            where.method = method;
        }

        if (userId) {
            where.performedBy = userId;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        if (search) {
            // Search by payment ID, ticket number, or reference
            where.OR = [
                { id: { contains: search } },
                { reference: { contains: search } },
                { ticket: { ticketNumber: { contains: search } } },
            ];
        }

        // Get total count
        const total = await prisma.payment.count({ where });

        // Get payments with pagination
        const payments = await prisma.payment.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc',
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
                performedByUser: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        return NextResponse.json({
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

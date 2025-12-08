/**
 * API Route: GET /api/v2/inventory-adjustments
 * Fetches paginated inventory adjustments with search and filter support
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
        const partId = searchParams.get('partId') || '';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (partId) {
            where.partId = partId;
        }

        if (search) {
            where.OR = [
                { reason: { contains: search } },
                { part: { name: { contains: search } } },
                { part: { sku: { contains: search } } },
                { createdByUser: { name: { contains: search } } },
                { createdByUser: { username: { contains: search } } },
            ];
        }

        // Fetch inventory adjustments with pagination
        const [adjustments, total] = await Promise.all([
            prisma.inventoryAdjustment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    part: {
                        select: {
                            name: true,
                            sku: true,
                        },
                    },
                    ticket: {
                        select: {
                            ticketNumber: true,
                        },
                    },
                    createdByUser: {
                        select: {
                            name: true,
                            username: true,
                        },
                    },
                },
            }),
            prisma.inventoryAdjustment.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: adjustments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching inventory adjustments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory adjustments' },
            { status: 500 }
        );
    }
}

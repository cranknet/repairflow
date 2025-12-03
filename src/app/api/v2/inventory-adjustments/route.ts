/**
 * API Route: /api/v2/inventory-adjustments
 * GET - List inventory adjustments
 * POST - Create manual adjustment
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAdjustmentSchema = z.object({
    partId: z.string().min(1, 'Part ID is required'),
    qtyChange: z.number().int().refine((val) => val !== 0, {
        message: 'Quantity change cannot be zero',
    }),
    cost: z.number().nonnegative('Cost must be non-negative'),
    costPerUnit: z.number().positive().optional(),
    reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin-only check
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only administrators can view inventory adjustments' },
                { status: 403 }
            );
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '25');
        const partId = searchParams.get('partId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const hasRelatedReturn = searchParams.get('hasRelatedReturn');

        // Build where clause
        const where: any = {};

        if (partId) {
            where.partId = partId;
        }

        if (hasRelatedReturn === 'true') {
            where.relatedReturnId = { not: null };
        } else if (hasRelatedReturn === 'false') {
            where.relatedReturnId = null;
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

        // Get total count
        const total = await prisma.inventoryAdjustment.count({ where });

        // Get adjustments with pagination
        const adjustments = await prisma.inventoryAdjustment.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                part: {
                    select: {
                        name: true,
                        sku: true,
                        quantity: true,
                    },
                },
                createdByUser: {
                    select: {
                        name: true,
                        username: true,
                    },
                },
            },
        });

        return NextResponse.json({
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

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin-only check
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only administrators can create inventory adjustments' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validated = createAdjustmentSchema.parse(body);

        // Validate part exists
        const part = await prisma.part.findUnique({
            where: { id: validated.partId },
        });

        if (!part) {
            return NextResponse.json({ error: 'Part not found' }, { status: 404 });
        }

        // Calculate cost per unit if not provided
        const costPerUnit = validated.costPerUnit || (validated.cost / Math.abs(validated.qtyChange));

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Create adjustment
            const adjustment = await tx.inventoryAdjustment.create({
                data: {
                    partId: validated.partId,
                    qtyChange: validated.qtyChange,
                    cost: validated.cost,
                    costPerUnit,
                    reason: validated.reason,
                    createdById: session.user.id,
                },
                include: {
                    part: {
                        select: {
                            name: true,
                            sku: true,
                        },
                    },
                    createdByUser: {
                        select: {
                            name: true,
                            username: true,
                        },
                    },
                },
            });

            // Update part quantity
            await tx.part.update({
                where: { id: validated.partId },
                data: {
                    quantity: {
                        increment: validated.qtyChange,
                    },
                },
            });

            // Create journal entry
            await tx.journalEntry.create({
                data: {
                    type: 'INVENTORY_ADJUSTMENT',
                    amount: validated.cost,
                    description: `Inventory adjustment: ${validated.qtyChange > 0 ? '+' : ''}${validated.qtyChange} ${part.name}`,
                    referenceType: 'INVENTORY_ADJUSTMENT',
                    referenceId: adjustment.id,
                    notes: validated.reason,
                    metadata: JSON.stringify({
                        partId: validated.partId,
                        partSku: part.sku,
                        qtyChange: validated.qtyChange,
                        costPerUnit,
                    }),
                    createdById: session.user.id,
                },
            });

            return adjustment;
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: 'Inventory adjustment created successfully',
        });
    } catch (error: any) {
        console.error('Error creating inventory adjustment:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create inventory adjustment', message: error.message },
            { status: 500 }
        );
    }
}

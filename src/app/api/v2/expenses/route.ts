/**
 * API Route: /api/v2/expenses
 * GET - List expenses with filters
 * POST - Create new expense
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createExpenseSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    amount: z.number().positive('Amount must be greater than 0'),
    type: z.enum(['PURCHASE', 'SHOP', 'PART_LOSS', 'MISC']),
    category: z.string().optional(),
    partId: z.string().optional(),
    deviceId: z.string().optional(),
    notes: z.string().optional(),
    receiptUrl: z.string().url().optional(),
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
                { error: 'Only administrators can view expenses' },
                { status: 403 }
            );
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '25');
        const type = searchParams.get('type');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const userId = searchParams.get('userId');
        const partId = searchParams.get('partId');
        const search = searchParams.get('search');

        // Build where clause
        const where: any = {
            deletedAt: null, // Exclude soft-deleted
        };

        if (type) {
            where.type = type;
        }

        if (userId) {
            where.createdById = userId;
        }

        if (partId) {
            where.partId = partId;
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
            where.OR = [
                { name: { contains: search } },
                { notes: { contains: search } },
            ];
        }

        // Get total count
        const total = await prisma.expense.count({ where });

        // Get expenses with pagination
        const expenses = await prisma.expense.findMany({
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
            data: expenses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expenses' },
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
                { error: 'Only administrators can create expenses' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validated = createExpenseSchema.parse(body);

        // Validate part exists if partId provided
        if (validated.partId) {
            const part = await prisma.part.findUnique({
                where: { id: validated.partId },
            });
            if (!part) {
                return NextResponse.json(
                    { error: 'Part not found' },
                    { status: 404 }
                );
            }
        }

        // Create expense
        const expense = await prisma.expense.create({
            data: {
                ...validated,
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

        // Create journal entry
        await prisma.journalEntry.create({
            data: {
                type: 'EXPENSE',
                amount: validated.amount,
                description: `Expense created: ${validated.name}`,
                referenceType: 'EXPENSE',
                referenceId: expense.id,
                notes: validated.notes,
                metadata: JSON.stringify({
                    expenseType: validated.type,
                    category: validated.category,
                }),
                createdById: session.user.id,
            },
        });

        return NextResponse.json({
            success: true,
            data: expense,
            message: 'Expense created successfully',
        });
    } catch (error: any) {
        console.error('Error creating expense:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create expense', message: error.message },
            { status: 500 }
        );
    }
}

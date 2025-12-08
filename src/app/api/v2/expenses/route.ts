/**
 * API Route: /api/v2/expenses
 * Handles expense management - GET (list) and POST (create)
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
        const type = searchParams.get('type') || '';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            deletedAt: null, // Exclude soft-deleted expenses
        };

        if (type) {
            where.type = type;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { notes: { contains: search } },
                { category: { contains: search } },
                { part: { name: { contains: search } } },
                { createdByUser: { name: { contains: search } } },
                { createdByUser: { username: { contains: search } } },
            ];
        }

        // Fetch expenses with pagination
        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
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
                    createdByUser: {
                        select: {
                            name: true,
                            username: true,
                        },
                    },
                },
            }),
            prisma.expense.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
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

        const body = await request.json();
        const { name, amount, type, category, partId, notes, receiptUrl } = body;

        // Validate required fields
        if (!name || amount === undefined || !type) {
            return NextResponse.json(
                { error: 'Name, amount, and type are required' },
                { status: 400 }
            );
        }

        // Validate amount is a positive number
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be a positive number' },
                { status: 400 }
            );
        }

        // Validate type
        const validTypes = ['PURCHASE', 'SHOP', 'PART_LOSS', 'MISC'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid expense type' },
                { status: 400 }
            );
        }

        // Create the expense
        const expense = await prisma.expense.create({
            data: {
                name,
                amount,
                type,
                category: category || null,
                partId: partId || null,
                notes: notes || null,
                receiptUrl: receiptUrl || null,
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

        return NextResponse.json({
            success: true,
            data: expense,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json(
            { error: 'Failed to create expense' },
            { status: 500 }
        );
    }
}

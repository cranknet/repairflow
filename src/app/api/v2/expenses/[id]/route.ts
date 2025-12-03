/**
 * API Route: DELETE /api/v2/expenses/[id]
 * Soft delete an expense
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
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
                { error: 'Only administrators can delete expenses' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Check if expense exists
        const expense = await prisma.expense.findUnique({
            where: { id },
        });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        if (expense.deletedAt) {
            return NextResponse.json(
                { error: 'Expense already deleted' },
                { status: 400 }
            );
        }

        // Soft delete
        const deletedExpense = await prisma.expense.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Expense deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json(
            { error: 'Failed to delete expense' },
            { status: 500 }
        );
    }
}

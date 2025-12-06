import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const period = searchParams.get('period') || 'weekly';

        const now = new Date();
        let startDate: Date;
        let previousStartDate: Date;
        let previousEndDate: Date;

        switch (period) {
            case 'daily':
                // Today
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                // Yesterday
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 1);
                previousEndDate = new Date(startDate);
                previousEndDate.setMilliseconds(-1);
                break;

            case 'monthly':
                // This month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                // Last month
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                previousEndDate = new Date(startDate);
                previousEndDate.setMilliseconds(-1);
                break;

            case 'yearly':
                // This year
                startDate = new Date(now.getFullYear(), 0, 1);
                // Last year
                previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
                previousEndDate = new Date(startDate);
                previousEndDate.setMilliseconds(-1);
                break;

            case 'weekly':
            default:
                // Last 7 days
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                // Previous 7 days
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 7);
                previousEndDate = new Date(startDate);
                previousEndDate.setMilliseconds(-1);
                break;
        }

        // Fetch current period revenue
        const currentRevenue = await prisma.ticket.aggregate({
            where: {
                status: 'COMPLETED',
                completedAt: {
                    gte: startDate,
                },
            },
            _sum: {
                finalPrice: true,
            },
        });

        // Fetch previous period revenue
        const previousRevenue = await prisma.ticket.aggregate({
            where: {
                status: 'COMPLETED',
                completedAt: {
                    gte: previousStartDate,
                    lte: previousEndDate,
                },
            },
            _sum: {
                finalPrice: true,
            },
        });

        // Fetch current period expenses
        const currentExpenses = await prisma.expense.aggregate({
            where: {
                createdAt: {
                    gte: startDate,
                },
            },
            _sum: {
                amount: true,
            },
        });

        // Fetch current period refunds from Returns
        const currentRefunds = await prisma.return.aggregate({
            where: {
                status: 'APPROVED',
                createdAt: {
                    gte: startDate,
                },
            },
            _sum: {
                refundAmount: true,
            },
        });

        const revenue = currentRevenue._sum.finalPrice || 0;
        const prevRevenue = previousRevenue._sum.finalPrice || 0;
        const expenses = currentExpenses._sum?.amount || 0;
        const refunds = currentRefunds._sum?.refundAmount || 0;

        const profit = revenue - expenses - refunds;

        // Calculate percentage change
        const revenueChange = prevRevenue === 0
            ? (revenue > 0 ? 100 : 0)
            : Math.round(((revenue - prevRevenue) / prevRevenue) * 100);

        return NextResponse.json({
            revenue,
            revenueChange,
            profit,
            profitChange: revenueChange, // Simplified
            expenses,
            refunds,
            period,
        });

    } catch (error) {
        console.error('Error fetching period stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch period stats' },
            { status: 500 }
        );
    }
}

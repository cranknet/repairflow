/**
 * Financial Calculations Service
 * Provides aggregated financial metrics for dashboard and reporting
 */

import { prisma } from '@/lib/prisma';

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface DailyMetrics {
    date: Date;
    value: number;
}

export interface FinancialSummary {
    dailyRevenue: number;
    dailyRefunds: number;
    dailyExpenses: number;
    grossMargin: number;
    netProfit: number;
    partsUsed: number;
    returnsPending: number;
}

/**
 * Get daily revenue (sum of positive payments)
 */
export async function getDailyRevenue(dateRange: DateRange): Promise<number> {
    const { startDate, endDate } = dateRange;

    const result = await prisma.payment.aggregate({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            amount: {
                gt: 0, // Only positive amounts (not refunds)
            },
        },
        _sum: {
            amount: true,
        },
    });

    return result._sum.amount || 0;
}

/**
 * Get daily refunds (sum of negative payments or from journal entries)
 */
export async function getDailyRefunds(dateRange: DateRange): Promise<number> {
    const { startDate, endDate } = dateRange;

    // Method 1: From journal entries
    const result = await prisma.journalEntry.aggregate({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            type: 'REFUND',
        },
        _sum: {
            amount: true,
        },
    });

    return result._sum.amount || 0;
}

/**
 * Get daily expenses
 */
export async function getDailyExpenses(dateRange: DateRange): Promise<number> {
    const { startDate, endDate } = dateRange;

    const result = await prisma.expense.aggregate({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            deletedAt: null, // Exclude soft-deleted expenses
        },
        _sum: {
            amount: true,
        },
    });

    return result._sum.amount || 0;
}

/**
 * Get inventory loss (from inventory adjustments with negative changes)
 */
export async function getInventoryLoss(dateRange: DateRange): Promise<number> {
    const { startDate, endDate } = dateRange;

    const adjustments = await prisma.inventoryAdjustment.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            qtyChange: {
                lt: 0, // Negative changes (losses)
            },
        },
    });

    const totalLoss = adjustments.reduce((sum, adj) => {
        return sum + Math.abs(adj.cost);
    }, 0);

    return totalLoss;
}

/**
 * Get net profit (revenue - refunds - expenses - inventory loss)
 */
export async function getNetProfit(dateRange: DateRange): Promise<number> {
    const revenue = await getDailyRevenue(dateRange);
    const refunds = await getDailyRefunds(dateRange);
    const expenses = await getDailyExpenses(dateRange);
    const inventoryLoss = await getInventoryLoss(dateRange);

    return revenue - refunds - expenses - inventoryLoss;
}

/**
 * Get gross margin ((revenue - refunds) / revenue) * 100%
 */
export async function getGrossMargin(dateRange: DateRange): Promise<number> {
    const revenue = await getDailyRevenue(dateRange);
    const refunds = await getDailyRefunds(dateRange);

    if (revenue === 0) {
        return 0;
    }

    return ((revenue - refunds) / revenue) * 100;
}

/**
 * Get parts used count for the period
 */
export async function getPartsUsed(dateRange: DateRange): Promise<number> {
    const { startDate, endDate } = dateRange;

    const result = await prisma.inventoryAdjustment.aggregate({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            qtyChange: {
                lt: 0, // Negative means parts used
            },
        },
        _sum: {
            qtyChange: true,
        },
    });

    return Math.abs(result._sum.qtyChange || 0);
}

/**
 * Get pending returns count
 */
export async function getPendingReturnsCount(): Promise<number> {
    const count = await prisma.return.count({
        where: {
            status: 'PENDING',
        },
    });

    return count;
}

/**
 * Get high-loss devices (top devices by expense amount)
 */
export async function getHighLossDevices(dateRange: DateRange, limit: number = 5) {
    const { startDate, endDate } = dateRange;

    const expenses = await prisma.expense.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            deviceId: {
                not: null,
            },
            deletedAt: null,
        },
        select: {
            deviceId: true,
            amount: true,
        },
    });

    // Group by deviceId and sum amounts
    const expensesByDevice = expenses.reduce((acc, expense) => {
        if (expense.deviceId) {
            if (!acc[expense.deviceId]) {
                acc[expense.deviceId] = 0;
            }
            acc[expense.deviceId] += expense.amount;
        }
        return acc;
    }, {} as Record<string, number>);

    // Sort and return top N
    const sorted = Object.entries(expensesByDevice)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([deviceId, amount]) => ({
            deviceId,
            totalExpense: amount,
        }));

    return sorted;
}

/**
 * Get comprehensive financial summary for a date range
 */
export async function getFinancialSummary(dateRange: DateRange): Promise<FinancialSummary> {
    const [
        dailyRevenue,
        dailyRefunds,
        dailyExpenses,
        grossMargin,
        netProfit,
        partsUsed,
        returnsPending,
    ] = await Promise.all([
        getDailyRevenue(dateRange),
        getDailyRefunds(dateRange),
        getDailyExpenses(dateRange),
        getGrossMargin(dateRange),
        getNetProfit(dateRange),
        getPartsUsed(dateRange),
        getPendingReturnsCount(),
    ]);

    return {
        dailyRevenue,
        dailyRefunds,
        dailyExpenses,
        grossMargin,
        netProfit,
        partsUsed,
        returnsPending,
    };
}

/**
 * Get revenue trend (daily breakdown)
 */
export async function getRevenueTrend(dateRange: DateRange): Promise<DailyMetrics[]> {
    const { startDate, endDate } = dateRange;

    // This would ideally use SQL GROUP BY DATE
    // For SQLite, we'll fetch all and group in JS
    const payments = await prisma.payment.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            amount: {
                gt: 0,
            },
        },
        select: {
            amount: true,
            createdAt: true,
        },
    });

    // Group by date
    const groupedByDate = payments.reduce((acc, payment) => {
        const dateKey = payment.createdAt.toISOString().split('T')[0];
        if (!acc[dateKey]) {
            acc[dateKey] = 0;
        }
        acc[dateKey] += payment.amount;
        return acc;
    }, {} as Record<string, number>);

    // Convert to array
    return Object.entries(groupedByDate).map(([dateStr, value]) => ({
        date: new Date(dateStr),
        value,
    }));
}

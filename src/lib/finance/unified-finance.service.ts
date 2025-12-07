/**
 * Unified Financial Calculation Service
 * 
 * Single source of truth for all financial calculations across the app.
 * This service ensures consistent profit, revenue, and cost calculations
 * across all dashboards and reports.
 */

import { prisma } from '@/lib/prisma';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface TicketFinancials {
    revenue: number;      // Sum of ticket.finalPrice for completed tickets
    partsCost: number;    // Sum of (Part.unitPrice × TicketPart.quantity)
    grossProfit: number;  // revenue - partsCost
}

export interface FinancialMetrics {
    revenue: number;        // Sum of ticket.finalPrice for completed tickets
    partsCost: number;      // Sum of (Part.unitPrice × TicketPart.quantity)
    refunds: number;        // Sum of approved Return.refundAmount
    expenses: number;       // Sum of Expense.amount (excluding soft-deleted)
    inventoryLoss: number;  // Sum of negative inventory adjustments
    grossProfit: number;    // revenue - partsCost
    netProfit: number;      // revenue - partsCost - refunds - expenses - inventoryLoss
    grossMargin: number;    // (grossProfit / revenue) × 100%
    ticketCount: number;    // Number of completed tickets
}

export interface FinancialMetricsWithComparison extends FinancialMetrics {
    revenueChange: number;      // Percentage change from previous period
    profitChange: number;       // Percentage change from previous period
    previousRevenue: number;
    previousNetProfit: number;
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get the previous period date range for comparison
 */
export function getPreviousPeriodRange(
    dateRange: DateRange,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly'
): DateRange {
    const { startDate, endDate } = dateRange;
    const duration = endDate.getTime() - startDate.getTime();

    switch (period) {
        case 'daily':
            return {
                startDate: new Date(startDate.getTime() - 24 * 60 * 60 * 1000),
                endDate: new Date(startDate.getTime() - 1),
            };
        case 'monthly':
            return {
                startDate: new Date(startDate.getFullYear(), startDate.getMonth() - 1, startDate.getDate()),
                endDate: new Date(startDate.getTime() - 1),
            };
        case 'yearly':
            return {
                startDate: new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate()),
                endDate: new Date(startDate.getTime() - 1),
            };
        case 'weekly':
        default:
            return {
                startDate: new Date(startDate.getTime() - duration),
                endDate: new Date(startDate.getTime() - 1),
            };
    }
}

/**
 * Create date range for a specific period
 */
export function createDateRange(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly'
): DateRange {
    const now = new Date();

    switch (period) {
        case 'daily':
            return {
                startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
                endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
            };
        case 'monthly':
            return {
                startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
                endDate: now,
            };
        case 'yearly':
            return {
                startDate: new Date(now.getFullYear(), 0, 1, 0, 0, 0),
                endDate: now,
            };
        case 'weekly':
        default:
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - 7);
            weekStart.setHours(0, 0, 0, 0);
            return {
                startDate: weekStart,
                endDate: now,
            };
    }
}

// ============================================
// CORE CALCULATION FUNCTIONS
// ============================================

/**
 * Get ticket-level financials: revenue and parts cost
 * Includes COMPLETED tickets and REPAIRED tickets that are paid
 */
export async function getTicketFinancials(dateRange: DateRange): Promise<TicketFinancials> {
    const { startDate, endDate } = dateRange;

    // Fetch tickets that count as revenue:
    // - COMPLETED tickets (with completedAt in range)
    // - OR REPAIRED tickets that are paid (with updatedAt in range as proxy for when they were repaired/paid)
    // - Exclude soft-deleted tickets
    const tickets = await prisma.ticket.findMany({
        where: {
            deletedAt: null, // Exclude soft-deleted tickets
            OR: [
                // COMPLETED tickets
                {
                    status: 'COMPLETED',
                    completedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                // REPAIRED tickets that are paid (revenue recognized when paid)
                {
                    status: 'REPAIRED',
                    paid: true,
                    updatedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            ],
        },
        select: {
            finalPrice: true,
            estimatedPrice: true, // Fallback if finalPrice not set
            parts: {
                include: {
                    part: {
                        select: {
                            unitPrice: true,
                        },
                    },
                },
            },
        },
    });

    let revenue = 0;
    let partsCost = 0;

    for (const ticket of tickets) {
        // Use finalPrice if set, otherwise fall back to estimatedPrice
        revenue += ticket.finalPrice ?? ticket.estimatedPrice ?? 0;

        // Calculate parts cost for this ticket
        for (const tp of ticket.parts) {
            partsCost += tp.part.unitPrice * tp.quantity;
        }
    }

    return {
        revenue,
        partsCost,
        grossProfit: revenue - partsCost,
    };
}

/**
 * Get total refunds (approved returns only)
 */
export async function getRefundsTotal(dateRange: DateRange): Promise<number> {
    const { startDate, endDate } = dateRange;

    const result = await prisma.return.aggregate({
        where: {
            status: 'APPROVED',
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
        _sum: {
            refundAmount: true,
        },
    });

    return result._sum.refundAmount || 0;
}

/**
 * Get total expenses (excluding soft-deleted)
 */
export async function getExpensesTotal(dateRange: DateRange): Promise<number> {
    const { startDate, endDate } = dateRange;

    const result = await prisma.expense.aggregate({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            deletedAt: null,
        },
        _sum: {
            amount: true,
        },
    });

    return result._sum.amount || 0;
}

/**
 * Get inventory loss from negative adjustments
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
                lt: 0,
            },
        },
        select: {
            cost: true,
        },
    });

    return adjustments.reduce((sum, adj) => sum + Math.abs(adj.cost), 0);
}

/**
 * Get count of revenue-generating tickets in the date range
 * (COMPLETED or REPAIRED+paid), excluding soft-deleted
 */
export async function getCompletedTicketCount(dateRange: DateRange): Promise<number> {
    const { startDate, endDate } = dateRange;

    return prisma.ticket.count({
        where: {
            deletedAt: null, // Exclude soft-deleted tickets
            OR: [
                {
                    status: 'COMPLETED',
                    completedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                {
                    status: 'REPAIRED',
                    paid: true,
                    updatedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            ],
        },
    });
}

// ============================================
// AGGREGATED METRICS
// ============================================

/**
 * Get complete financial metrics for a date range
 */
export async function getFinancialMetrics(dateRange: DateRange): Promise<FinancialMetrics> {
    const [
        ticketFinancials,
        refunds,
        expenses,
        inventoryLoss,
        ticketCount,
    ] = await Promise.all([
        getTicketFinancials(dateRange),
        getRefundsTotal(dateRange),
        getExpensesTotal(dateRange),
        getInventoryLoss(dateRange),
        getCompletedTicketCount(dateRange),
    ]);

    const { revenue, partsCost, grossProfit } = ticketFinancials;
    const netProfit = revenue - partsCost - refunds - expenses - inventoryLoss;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
        revenue,
        partsCost,
        refunds,
        expenses,
        inventoryLoss,
        grossProfit,
        netProfit,
        grossMargin,
        ticketCount,
    };
}

/**
 * Get financial metrics with period-over-period comparison
 */
export async function getFinancialMetricsWithComparison(
    dateRange: DateRange,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly'
): Promise<FinancialMetricsWithComparison> {
    const previousRange = getPreviousPeriodRange(dateRange, period);

    const [currentMetrics, previousMetrics] = await Promise.all([
        getFinancialMetrics(dateRange),
        getFinancialMetrics(previousRange),
    ]);

    const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / Math.abs(previous)) * 100);
    };

    return {
        ...currentMetrics,
        revenueChange: calculateChange(currentMetrics.revenue, previousMetrics.revenue),
        profitChange: calculateChange(currentMetrics.netProfit, previousMetrics.netProfit),
        previousRevenue: previousMetrics.revenue,
        previousNetProfit: previousMetrics.netProfit,
    };
}

// ============================================
// DAILY METRICS (for finance dashboard compatibility)
// ============================================

/**
 * Get daily financial summary (compatible with existing FinanceSummary interface)
 */
export async function getDailyFinanceSummary(dateRange: DateRange) {
    const metrics = await getFinancialMetrics(dateRange);

    // Get parts used count
    const partsUsedResult = await prisma.inventoryAdjustment.aggregate({
        where: {
            createdAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
            },
            qtyChange: {
                lt: 0,
            },
        },
        _sum: {
            qtyChange: true,
        },
    });

    // Get pending returns count
    const returnsPending = await prisma.return.count({
        where: {
            status: 'PENDING',
        },
    });

    return {
        dailyRevenue: metrics.revenue,
        dailyRefunds: metrics.refunds,
        dailyExpenses: metrics.expenses,
        grossMargin: metrics.grossMargin,
        netProfit: metrics.netProfit,
        partsUsed: Math.abs(partsUsedResult._sum.qtyChange || 0),
        returnsPending,
        // Additional fields for transparency
        partsCost: metrics.partsCost,
        grossProfit: metrics.grossProfit,
        inventoryLoss: metrics.inventoryLoss,
    };
}

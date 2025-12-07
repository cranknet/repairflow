/**
 * API Route: GET /api/finance/metrics
 * 
 * Unified financial metrics endpoint - SINGLE SOURCE OF TRUTH
 * Used by both Dashboard and Finance pages for consistent calculations
 * 
 * Query Parameters:
 * - period: 'daily' | 'weekly' | 'monthly' | 'yearly' (default: 'weekly')
 * - startDate: ISO date string (optional, for custom range)
 * - endDate: ISO date string (optional, for custom range)
 * - includeComparison: 'true' | 'false' (default: 'true')
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
    createDateRange,
    getFinancialMetrics,
    getFinancialMetricsWithComparison,
    type FinancialMetrics,
    type FinancialMetricsWithComparison,
} from '@/lib/finance/unified-finance.service';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const period = (searchParams.get('period') || 'weekly') as 'daily' | 'weekly' | 'monthly' | 'yearly';
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const includeComparison = searchParams.get('includeComparison') !== 'false';

        // Determine date range
        let dateRange;
        if (startDateParam && endDateParam) {
            // Custom date range
            dateRange = {
                startDate: new Date(startDateParam),
                endDate: new Date(endDateParam),
            };
        } else {
            // Use period-based date range
            dateRange = createDateRange(period);
        }

        // Get unified financial metrics
        let metrics: FinancialMetrics | FinancialMetricsWithComparison;

        if (includeComparison) {
            metrics = await getFinancialMetricsWithComparison(dateRange, period);
        } else {
            metrics = await getFinancialMetrics(dateRange);
        }

        // Get additional counts for UI
        const [partsUsedCount, returnsPendingCount] = await Promise.all([
            // Parts used in completed tickets during date range
            prisma.ticketPart.count({
                where: {
                    ticket: {
                        status: 'COMPLETED',
                        completedAt: {
                            gte: dateRange.startDate,
                            lte: dateRange.endDate,
                        },
                    },
                },
            }),
            // Pending returns count (regardless of date)
            prisma.return.count({
                where: { status: 'PENDING' },
            }),
        ]);

        // Build response with all financial data
        const response = {
            // Core metrics
            revenue: metrics.revenue,
            partsCost: metrics.partsCost,
            refunds: metrics.refunds,
            expenses: metrics.expenses,
            inventoryLoss: metrics.inventoryLoss,

            // Calculated profits
            grossProfit: metrics.grossProfit,
            netProfit: metrics.netProfit,
            grossMargin: metrics.grossMargin,

            // Counts
            ticketCount: metrics.ticketCount,
            partsUsedCount,
            returnsPendingCount,

            // Comparison data (if requested)
            ...(includeComparison && 'revenueChange' in metrics ? {
                revenueChange: metrics.revenueChange,
                profitChange: metrics.profitChange,
                previousRevenue: metrics.previousRevenue,
                previousNetProfit: metrics.previousNetProfit,
            } : {}),

            // Metadata
            period,
            dateRange: {
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString(),
            },
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching financial metrics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch financial metrics' },
            { status: 500 }
        );
    }
}

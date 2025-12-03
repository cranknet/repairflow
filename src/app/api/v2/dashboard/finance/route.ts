/**
 * API Route: GET /api/v2/dashboard/finance
 * Get aggregated financial metrics for dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFinancialSummary, getHighLossDevices } from '@/lib/finance/calculations.service';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin-only check
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only administrators can view financial dashboard' },
                { status: 403 }
            );
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Default to today if not provided
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const dateRange = {
            startDate: startDateParam ? new Date(startDateParam) : startOfDay,
            endDate: endDateParam ? new Date(endDateParam) : endOfDay,
        };

        // Get financial summary
        const summary = await getFinancialSummary(dateRange);

        // Get high loss devices
        const highLossDevices = await getHighLossDevices(dateRange, 5);

        return NextResponse.json({
            summary,
            highLossDevices,
            dateRange: {
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error fetching financial dashboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch financial dashboard' },
            { status: 500 }
        );
    }
}

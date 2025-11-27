import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, eachDayOfInterval, differenceInDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const rangeType = searchParams.get('rangeType') || 'lastWeek';

    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Fetch completed tickets in the date range
    const tickets = await prisma.ticket.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: {
        finalPrice: true,
        completedAt: true,
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

    const daysDiff = differenceInDays(endDate, startDate);
    let dateFormat: string;
    let dateInterval: Date[];

    // Determine grouping based on date range
    if (daysDiff <= 7) {
      // Group by day
      dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
      dateFormat = 'EEE'; // Day name (Mon, Tue, etc.)
    } else if (daysDiff <= 31) {
      // Group by day
      dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
      dateFormat = 'dd MMM'; // Day and month
    } else {
      // Group by week
      dateInterval = [];
      let current = new Date(startDate);
      while (current <= endDate) {
        dateInterval.push(new Date(current));
        current = new Date(current);
        current.setDate(current.getDate() + 7);
      }
      dateFormat = 'dd MMM'; // Week start date
    }

    const salesData = dateInterval.map((date) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      // For weekly grouping, extend to end of week
      const actualEnd = daysDiff > 31 
        ? new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000)
        : dayEnd;

      const dayTickets = tickets.filter(
        (t) => t.completedAt && t.completedAt >= dayStart && t.completedAt <= actualEnd
      );

      const daySales = dayTickets.reduce((sum, t) => sum + (t.finalPrice || 0), 0);
      const dayCogs = dayTickets.reduce((sum, t) => {
        const partsCost = t.parts.reduce(
          (pSum, tp) => pSum + tp.part.unitPrice * tp.quantity,
          0
        );
        return sum + partsCost;
      }, 0);

      return {
        date: format(date, dateFormat),
        sales: Math.round(daySales * 100) / 100,
        cogs: Math.round(dayCogs * 100) / 100,
      };
    });

    const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);
    const totalCogs = salesData.reduce((sum, d) => sum + d.cogs, 0);
    const invoices = tickets.length;

    const dateRangeLabel = `${format(startDate, 'dd MMM yyyy')} to ${format(endDate, 'dd MMM yyyy')}`;

    return NextResponse.json({
      data: salesData,
      invoices,
      totalSales,
      totalCogs,
      dateRangeLabel,
    });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}


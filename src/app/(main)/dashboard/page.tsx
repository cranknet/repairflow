import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardKPIs } from '@/components/dashboard/dashboard-kpis';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { SalesTarget } from '@/components/dashboard/sales-target';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardTicketTable } from '@/components/dashboard/dashboard-ticket-table';
import { DashboardTicketHeader } from '@/components/dashboard/dashboard-ticket-header';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  // Calculate date ranges for comparisons
  const now = new Date();
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);

  const previousWeekStart = new Date(now);
  previousWeekStart.setDate(previousWeekStart.getDate() - 14);
  previousWeekStart.setHours(0, 0, 0, 0);
  const previousWeekEnd = new Date(now);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);
  previousWeekEnd.setHours(23, 59, 59, 999);

  const [
    activeTickets,
    previousWeekActiveTickets,
    totalCustomers,
    previousWeekCustomers,
    lowStockItems,
    previousWeekLowStock,
    revenue,
    previousWeekRevenue,
    completedTickets,
    previousWeekCompletedTickets,
    inProgressTickets,
    waitingTickets,
    repairedTickets,
    recentTickets,
    settings,
  ] = await Promise.all([
    // Current week active tickets
    prisma.ticket.count({
      where: {
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
    }),
    // Previous week active tickets
    prisma.ticket.count({
      where: {
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
        createdAt: {
          gte: previousWeekStart,
          lte: previousWeekEnd,
        },
      },
    }),
    // Current total customers
    prisma.customer.count(),
    // Previous week customers count
    prisma.customer.count({
      where: {
        createdAt: {
          lte: previousWeekEnd,
        },
      },
    }),
    // Current low stock items
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM Part WHERE quantity <= reorderLevel
    `.then((result) => Number(result[0]?.count || 0)),
    // Previous week low stock (approximate - using current count as baseline)
    Promise.resolve(0), // We'll calculate this differently if needed
    // Current week revenue
    prisma.ticket.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: lastWeekStart,
        },
      },
      _sum: {
        finalPrice: true,
      },
    }),
    // Previous week revenue
    prisma.ticket.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: previousWeekStart,
          lte: previousWeekEnd,
        },
      },
      _sum: {
        finalPrice: true,
      },
    }),
    // Current week completed tickets
    prisma.ticket.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: lastWeekStart,
        },
      },
    }),
    // Previous week completed tickets
    prisma.ticket.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: previousWeekStart,
          lte: previousWeekEnd,
        },
      },
    }),
    prisma.ticket.count({
      where: { status: 'IN_PROGRESS' },
    }),
    prisma.ticket.count({
      where: { status: 'WAITING_FOR_PARTS' },
    }),
    prisma.ticket.count({
      where: { status: 'REPAIRED' },
    }),
    prisma.ticket.findMany({
      take: 10,
      where: {
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        assignedTo: {
          select: {
            name: true,
            username: true,
          },
        },
        satisfactionRatings: {
          select: {
            id: true,
            rating: true,
            comment: true,
            phoneNumber: true,
            verifiedBy: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    }),
    prisma.settings.findMany({
      where: {
        key: {
          in: ['company_name', 'company_logo'],
        },
      },
    }),
  ]);

  // Fetch finance metrics for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const financeSummary = await fetch(
    `http://localhost:${process.env.PORT || 3000}/api/v2/dashboard/finance?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`,
    { cache: 'no-store' }
  ).then(res => res.ok ? res.json() : null).catch(() => null);


  const weeklyRevenue = revenue._sum.finalPrice || 0;
  const previousWeekRevenueValue = previousWeekRevenue._sum.finalPrice || 0;
  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const revenueChange = calculateChange(weeklyRevenue, previousWeekRevenueValue);
  const activeTicketsChange = calculateChange(activeTickets, previousWeekActiveTickets);
  const customersChange = calculateChange(totalCustomers, previousWeekCustomers);
  const lowStockChange = calculateChange(lowStockItems, previousWeekLowStock);

  // Fetch sales data for last week (reuse lastWeekStart defined above)
  const weeklyTickets = await prisma.ticket.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: {
        gte: lastWeekStart,
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

  // Generate sales data grouped by day
  const lastWeekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return {
      dayName: format(date, 'EEE'),
      dayStart: date,
      dayEnd: dayEnd
    };
  });

  const salesData = lastWeekDates.map(({ dayName, dayStart, dayEnd }) => {
    const dayTickets = weeklyTickets.filter(
      (t) => t.completedAt && t.completedAt >= dayStart && t.completedAt <= dayEnd
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
      date: dayName,
      sales: Math.round(daySales * 100) / 100,
      cogs: Math.round(dayCogs * 100) / 100,
    };
  });

  const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);
  const totalCogs = salesData.reduce((sum, d) => sum + d.cogs, 0);

  // Calculate sales target (use monthly revenue as base)
  const monthlyTarget = 20000; // Can be made configurable
  const currentMonthSales = weeklyRevenue * 4; // Approximate

  // Serialize recent tickets data for client component
  const serializedRecentTickets = recentTickets.map((ticket) => ({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    completedAt: ticket.completedAt?.toISOString() || null,
    satisfactionRating: ticket.satisfactionRatings && ticket.satisfactionRatings.length > 0
      ? {
        id: ticket.satisfactionRatings[0].id,
        rating: ticket.satisfactionRatings[0].rating,
        comment: ticket.satisfactionRatings[0].comment,
        phoneNumber: ticket.satisfactionRatings[0].phoneNumber,
        verifiedBy: ticket.satisfactionRatings[0].verifiedBy,
        createdAt: ticket.satisfactionRatings[0].createdAt.toISOString(),
      }
      : null,
  }));
  customersChange = { customersChange }
  lowStockItems = { lowStockItems }
  lowStockChange = { lowStockChange }
  weeklyRevenue = { weeklyRevenue }
  revenueChange = { revenueChange }
    />

    {/* Charts Row */ }
    < div className = "grid grid-cols-1 gap-6" >
      {/* Sales vs COGS Chart */ }
      < SalesChart
  initialData = { salesData }
  initialInvoices = { completedTickets }
  initialTotalSales = { totalSales }
  initialTotalCogs = { totalCogs }
    />
        </div >

    {/* Bottom Row */ }
    < div className = "grid grid-cols-1 lg:grid-cols-3 gap-6" >
      {/* Tickets Table */ }
      < div className = "lg:col-span-2" >
        <Card>
          <CardHeader>
            <DashboardTicketHeader />
          </CardHeader>
          <CardContent>
            <DashboardTicketTable tickets={serializedRecentTickets} />
          </CardContent>
        </Card>
          </div >

    {/* Right Column */ }
    < div className = "space-y-6" >
      {/* Sales Target */ }
      < SalesTarget
  current = { currentMonthSales }
  target = { monthlyTarget }
  storeName = { settingsMap.company_name || 'RepairFlow' }
  date = { format(new Date(), 'dd MMMM yyyy')
}
            />
          </div >
        </div >
      </div >
    </MainLayout >
  );
}

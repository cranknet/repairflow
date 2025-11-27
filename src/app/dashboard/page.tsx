import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/dashboard/kpi-card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { SalesTarget } from '@/components/dashboard/sales-target';
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

  // Fetch dashboard metrics
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

  return (
    <MainLayout>
      <div className="space-y-8 p-6">
        {/* Welcome Message */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Welcome back, {session.user?.name || session.user?.username}!
            </h1>
            <p className="text-gray-600">Here&apos;s what&apos;s happening with your repair shop today.</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard
            title="Weekly Revenue"
            value={`$${weeklyRevenue.toFixed(2)}`}
            change={revenueChange}
            color="blue"
          />
          <KPICard
            title="Active Tickets"
            value={activeTickets.toString()}
            change={activeTicketsChange}
            color="green"
          />
          <KPICard
            title="Low Stock Items"
            value={lowStockItems.toString()}
            change={lowStockChange}
            color="yellow"
          />
          <KPICard
            title="Total Customers"
            value={totalCustomers.toString()}
            change={customersChange}
            color="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6">
          {/* Sales vs COGS Chart */}
          <SalesChart
            data={salesData}
            invoices={completedTickets}
            totalSales={totalSales}
            totalCogs={totalCogs}
          />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-lg shadow-soft">
                      TICKET
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-lg shadow-soft">
                      TODAY
                    </button>
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                      THIS MONTH
                    </button>
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                      LAST MONTH
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Ticket #</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Task</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Pick up time</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Assign To</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Customer</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTickets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-gray-500">
                            No active tickets
                          </td>
                        </tr>
                      ) : (
                        recentTickets.map((ticket) => (
                          <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4">
                              <Link
                                href={`/tickets/${ticket.id}`}
                                className="font-semibold text-blue-600 hover:text-purple-600 transition-colors"
                              >
                                {ticket.ticketNumber}
                              </Link>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{ticket.deviceIssue}</td>
                            <td className="py-4 px-4 text-gray-600">
                              {ticket.completedAt
                                ? format(new Date(ticket.completedAt), 'dd MMM yyyy (h:mma)')
                                : 'N/A'}
                            </td>
                            <td className="py-4 px-4 text-gray-600">
                              {ticket.assignedTo?.name || ticket.assignedTo?.username || 'Unassigned'}
                            </td>
                            <td className="py-4 px-4 font-medium text-gray-700">{ticket.customer.name}</td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                  ticket.status === 'IN_PROGRESS'
                                    ? 'bg-orange-100 text-orange-700'
                                    : ticket.status === 'WAITING_FOR_PARTS'
                                    ? 'bg-amber-100 text-amber-700'
                                    : ticket.status === 'REPAIRED'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {ticket.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Sales Target */}
            <SalesTarget
              current={currentMonthSales}
              target={monthlyTarget}
              storeName={settingsMap.company_name || 'RepairFlow'}
              date={format(new Date(), 'dd MMMM yyyy')}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

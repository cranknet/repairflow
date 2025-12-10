import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardQuickActions } from '@/components/dashboard/dashboard-quick-actions';
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { TicketsSection } from '@/components/dashboard/tickets-section';
import { format } from 'date-fns';
import {
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { ComponentType, SVGProps } from 'react';

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
    revenue,
    previousWeekRevenue,
    completedTickets,
    recentTickets,
    todayCompletedCount,
    pendingTickets,
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
    // Recent active tickets
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
    // Today's completed tickets count
    prisma.ticket.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    // Pending tickets (awaiting parts, waiting for customer, etc.)
    prisma.ticket.count({
      where: {
        status: {
          in: ['WAITING_FOR_PARTS', 'PENDING'],
        },
      },
    }),
  ]);

  const weeklyRevenue = revenue._sum.finalPrice || 0;
  const previousWeekRevenueValue = previousWeekRevenue._sum.finalPrice || 0;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const revenueChange = calculateChange(weeklyRevenue, previousWeekRevenueValue);
  const activeTicketsChange = calculateChange(activeTickets, previousWeekActiveTickets);
  const customersChange = calculateChange(totalCustomers, previousWeekCustomers);

  // Fetch sales data for last week
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <DashboardHeader
        userName={session.user?.name || session.user?.username || ''}
      />

      {/* Quick Actions Bar */}
      <DashboardQuickActions />

      {/* Hero Section: Revenue + Business Health */}
      <DashboardHero
        initialWeeklyRevenue={weeklyRevenue}
        initialRevenueChange={revenueChange}
        activeTickets={activeTickets}
        activeTicketsChange={activeTicketsChange}
        totalCustomers={totalCustomers}
        customersChange={customersChange}
        lowStockItems={lowStockItems}
      />

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Completed Today"
          value={todayCompletedCount}
          Icon={CheckCircleIcon}
          iconColor="text-success-500"
        />
        <MetricCard
          label="Pending"
          value={pendingTickets}
          Icon={ClockIcon}
          iconColor="text-warning-500"
        />
        <MetricCard
          label="This Week"
          value={completedTickets}
          Icon={CalendarDaysIcon}
          iconColor="text-brand-500"
        />
        <MetricCard
          label="Weekly Sales"
          value={`$${totalSales.toFixed(0)}`}
          Icon={BanknotesIcon}
          iconColor="text-success-500"
        />
      </div>

      {/* Sales Chart - Full Width */}
      <SalesChart
        initialData={salesData}
        initialInvoices={completedTickets}
        initialTotalSales={totalSales}
        initialTotalCogs={totalCogs}
      />

      {/* Recent Tickets - Full Width */}
      <TicketsSection tickets={serializedRecentTickets} />
    </div>
  );
}

// Compact metric card component
function MetricCard({
  label,
  value,
  Icon,
  iconColor = 'text-gray-500',
}: {
  label: string;
  value: string | number;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconColor?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-theme-xs hover:shadow-theme-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

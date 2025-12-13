import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

// Date helpers
function getDateRanges() {
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

  return { now, lastWeekStart, previousWeekStart, previousWeekEnd };
}

// Data Fetchers
async function getHeroData() {
  const { previousWeekStart, previousWeekEnd, lastWeekStart } = getDateRanges();

  const [
    activeTickets,
    previousWeekActiveTickets,
    totalCustomers,
    previousWeekCustomers,
    lowStockItems,
    revenue,
    previousWeekRevenue,
  ] = await Promise.all([
    prisma.ticket.count({
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    }),
    prisma.ticket.count({
      where: {
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        createdAt: { gte: previousWeekStart, lte: previousWeekEnd },
      },
    }),
    prisma.customer.count(),
    prisma.customer.count({
      where: { createdAt: { lte: previousWeekEnd } },
    }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "Part" WHERE quantity <= "reorderLevel"
    `.then((result) => Number(result[0]?.count || 0)).catch(() => 0),
    prisma.ticket.aggregate({
      where: { status: 'COMPLETED', completedAt: { gte: lastWeekStart } },
      _sum: { finalPrice: true },
    }),
    prisma.ticket.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: previousWeekStart, lte: previousWeekEnd },
      },
      _sum: { finalPrice: true },
    }),
  ]);

  const weeklyRevenue = revenue._sum.finalPrice || 0;
  const previousWeekRevenueValue = previousWeekRevenue._sum.finalPrice || 0;

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    initialWeeklyRevenue: weeklyRevenue,
    initialRevenueChange: calculateChange(weeklyRevenue, previousWeekRevenueValue),
    activeTickets,
    activeTicketsChange: calculateChange(activeTickets, previousWeekActiveTickets),
    totalCustomers,
    customersChange: calculateChange(totalCustomers, previousWeekCustomers),
    lowStockItems,
  };
}

async function getMetricsData() {
  const { lastWeekStart } = getDateRanges();
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

  const [todayCompletedCount, pendingTickets, completedTickets, weeklyRevenue] = await Promise.all([
    prisma.ticket.count({
      where: { status: 'COMPLETED', completedAt: { gte: todayStart } },
    }),
    prisma.ticket.count({
      where: { status: { in: ['WAITING_FOR_PARTS', 'PENDING'] } },
    }),
    prisma.ticket.count({
      where: { status: 'COMPLETED', completedAt: { gte: lastWeekStart } },
    }),
    prisma.ticket.aggregate({
      where: { status: 'COMPLETED', completedAt: { gte: lastWeekStart } },
      _sum: { finalPrice: true },
    }),
  ]);

  return {
    todayCompletedCount,
    pendingTickets,
    completedTickets,
    totalSales: weeklyRevenue._sum.finalPrice || 0,
  };
}

async function getSalesData() {
  const { lastWeekStart } = getDateRanges();

  const weeklyTickets = await prisma.ticket.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: { gte: lastWeekStart },
    },
    select: {
      finalPrice: true,
      completedAt: true,
      parts: {
        include: {
          part: { select: { unitPrice: true } },
        },
      },
    },
  });

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

  return {
    initialData: salesData,
    initialInvoices: weeklyTickets.length,
    initialTotalSales: totalSales,
    initialTotalCogs: totalCogs,
  };
}

async function getRecentTickets() {
  const recentTickets = await prisma.ticket.findMany({
    take: 10,
    where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      assignedTo: { select: { name: true, username: true } },
      satisfactionRatings: {
        select: {
          id: true,
          rating: true,
          comment: true,
          phoneNumber: true,
          verifiedBy: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return recentTickets.map((ticket) => ({
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
}

// Loaders
async function HeroLoader() {
  const data = await getHeroData();
  return <DashboardHero {...data} />;
}

async function MetricsLoader() {
  const data = await getMetricsData();
  return (
    <div className="grid-stats">
      <MetricCard
        label="Completed Today"
        value={data.todayCompletedCount}
        Icon={CheckCircleIcon}
        iconColor="text-success-500"
      />
      <MetricCard
        label="Pending"
        value={data.pendingTickets}
        Icon={ClockIcon}
        iconColor="text-warning-500"
      />
      <MetricCard
        label="This Week"
        value={data.completedTickets}
        Icon={CalendarDaysIcon}
        iconColor="text-brand-500"
      />
      <MetricCard
        label="Weekly Sales"
        value={`$${data.totalSales.toFixed(0)}`}
        Icon={BanknotesIcon}
        iconColor="text-success-500"
      />
    </div>
  );
}

async function SalesLoader() {
  const data = await getSalesData();
  return <SalesChart {...data} />;
}

async function TicketsLoader() {
  const tickets = await getRecentTickets();
  return <TicketsSection tickets={tickets} />;
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

// Skeletons
function HeroSkeleton() {
  return <div className="h-[200px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse mb-8" />;
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function SalesSkeleton() {
  return <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
}

function TicketsSkeleton() {
  return <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        userName={session.user?.name || session.user?.username || ''}
      />

      <DashboardQuickActions />

      <Suspense fallback={<HeroSkeleton />}>
        <HeroLoader />
      </Suspense>

      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsLoader />
      </Suspense>

      <Suspense fallback={<SalesSkeleton />}>
        <SalesLoader />
      </Suspense>

      <Suspense fallback={<TicketsSkeleton />}>
        <TicketsLoader />
      </Suspense>
    </div>
  );
}
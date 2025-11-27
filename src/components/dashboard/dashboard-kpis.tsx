'use client';

import { useLanguage } from '@/contexts/language-context';
import { KPICard } from './kpi-card';

interface DashboardKPIsProps {
  activeTickets: number;
  activeTicketsChange: number;
  totalCustomers: number;
  customersChange: number;
  lowStockItems: number;
  lowStockChange: number;
  weeklyRevenue: number;
  revenueChange: number;
}

export function DashboardKPIs({
  activeTickets,
  activeTicketsChange,
  totalCustomers,
  customersChange,
  lowStockItems,
  lowStockChange,
  weeklyRevenue,
  revenueChange,
}: DashboardKPIsProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <KPICard
        title={t('activeTickets')}
        value={activeTickets.toString()}
        change={activeTicketsChange}
        color="blue"
      />
      <KPICard
        title={t('totalCustomers')}
        value={totalCustomers.toString()}
        change={customersChange}
        color="green"
      />
      <KPICard
        title={t('lowStockItems')}
        value={lowStockItems.toString()}
        change={lowStockChange}
        color="yellow"
      />
      <KPICard
        title={t('totalRevenue')}
        value={`$${weeklyRevenue.toLocaleString()}`}
        change={revenueChange}
        color="purple"
      />
    </div>
  );
}


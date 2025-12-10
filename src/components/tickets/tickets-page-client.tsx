'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { NewTicketWizard } from '@/components/tickets/new-ticket-wizard';
import { useLanguage } from '@/contexts/language-context';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  TicketIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserIcon,
  DevicePhoneMobileIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface Ticket {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  deviceBrand: string;
  deviceModel: string;
  estimatedPrice: number;
  finalPrice?: number | null;
  createdAt: Date | string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  assignedTo: {
    name: string;
    username: string;
  } | null;
  hasPendingReturn?: boolean;
  totalPaid?: number;
  outstandingAmount?: number;
}

interface TicketsPageClientProps {
  tickets: Ticket[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  status?: string;
  search?: string;
  userRole: string;
}

const statusConfig: Record<string, { Icon: HeroIcon; gradient: string; bgLight: string; text: string; label: string }> = {
  PENDING: {
    Icon: ClockIcon,
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Pending',
  },
  IN_PROGRESS: {
    Icon: WrenchScrewdriverIcon,
    gradient: 'from-blue-500 to-cyan-600',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    label: 'In Progress',
  },
  REPAIRED: {
    Icon: CheckCircleIcon,
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Repaired',
  },
  WAITING_FOR_PARTS: {
    Icon: ClockIcon,
    gradient: 'from-purple-500 to-violet-600',
    bgLight: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    label: 'Waiting Parts',
  },
  COMPLETED: {
    Icon: CheckCircleIcon,
    gradient: 'from-green-500 to-emerald-600',
    bgLight: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    label: 'Completed',
  },
  CANCELLED: {
    Icon: XCircleIcon,
    gradient: 'from-red-500 to-rose-600',
    bgLight: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    label: 'Cancelled',
  },
  RETURNED: {
    Icon: ArrowUturnLeftIcon,
    gradient: 'from-gray-500 to-slate-600',
    bgLight: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-600 dark:text-gray-400',
    label: 'Returned',
  },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  LOW: { color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700' },
  MEDIUM: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  HIGH: { color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  URGENT: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

export function TicketsPageClient({
  tickets,
  totalCount,
  currentPage,
  totalPages,
  status,
  search,
  userRole,
}: TicketsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(search || '');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const handleSuccess = () => {
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (status) params.set('status', status);
    router.push(`/tickets?${params.toString()}`);
  };

  // Calculate stats from tickets
  const stats = useMemo(() => {
    const pending = tickets.filter((t) => t.status === 'PENDING').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const repaired = tickets.filter((t) => t.status === 'REPAIRED').length;
    const urgent = tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;

    return { pending, inProgress, repaired, urgent };
  }, [tickets]);

  const filterStatuses = [
    { key: '', label: t('all') || 'All' },
    { key: 'active', label: t('active') || 'Active' },
    { key: 'IN_PROGRESS', label: t('inProgress') || 'In Progress' },
    { key: 'REPAIRED', label: t('repaired') || 'Repaired' },
    { key: 'RETURNED', label: t('returned') || 'Returned' },
    { key: 'CANCELLED', label: t('cancelled') || 'Cancelled' },
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {t('tickets') || 'Repair Tickets'}
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl">
                  {t('manageTickets') || 'Manage and track all repair tickets'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-theme-sm">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards'
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                    {t('cards') || 'Cards'}
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <TableCellsIcon className="h-5 w-5" />
                    {t('table') || 'Table'}
                  </button>
                </div>

                {/* New Ticket Button */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
                >
                  <PlusIcon className="h-5 w-5" />
                  {t('createNewTicket') || 'New Ticket'}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                  <TicketIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalTickets') || 'Total Tickets'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('pending') || 'Pending'}</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('inProgress') || 'In Progress'}</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center relative">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                  {stats.urgent > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {stats.urgent}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('urgent') || 'High Priority'}</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.urgent}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('searchTickets') || 'Search by ticket #, customer, device...'}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                </div>
              </form>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {filterStatuses.map((filterStatus) => (
                  <Link
                    key={filterStatus.key}
                    href={filterStatus.key ? `/tickets?status=${filterStatus.key}` : '/tickets'}
                  >
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${status === filterStatus.key || (!status && filterStatus.key === '')
                          ? 'bg-primary text-white shadow-md shadow-primary/25'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {filterStatus.label}
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-6">
                <TicketIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('noTicketsFound') || 'No Tickets Found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                {t('noTicketsDescription') || 'No tickets match your current filters. Try adjusting your search or create a new ticket.'}
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
              >
                <PlusIcon className="h-5 w-5" />
                {t('createNewTicket') || 'Create New Ticket'}
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tickets.map((ticket) => {
                const config = statusConfig[ticket.status] || statusConfig.PENDING;
                const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;

                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-theme-lg hover:border-primary/20 transition-all duration-300"
                  >
                    {/* Status Bar */}
                    <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                            <config.Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {ticket.ticketNumber}
                            </p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${config.bgLight} ${config.text}`}>
                              {t(ticket.status.toLowerCase()) || config.label}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            ${(ticket.finalPrice ?? ticket.estimatedPrice).toFixed(2)}
                          </p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.color}`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        {/* Customer */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {ticket.customer.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.customer.phone}</p>
                          </div>
                        </div>

                        {/* Device */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-primary" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {ticket.deviceBrand} {ticket.deviceModel}
                          </p>
                        </div>

                        {/* Assigned To */}
                        {ticket.assignedTo && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <WrenchScrewdriverIcon className="h-5 w-5 text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {ticket.assignedTo.name || ticket.assignedTo.username}
                            </p>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2">
                          <ClockIcon className="h-4 w-4" />
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('ticketNumber') || 'Ticket #'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('customer') || 'Customer'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('device') || 'Device'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('status') || 'Status'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('priority') || 'Priority'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('price') || 'Price'}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('date') || 'Date'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tickets.map((ticket) => {
                      const config = statusConfig[ticket.status] || statusConfig.PENDING;
                      const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;

                      return (
                        <tr
                          key={ticket.id}
                          onClick={() => router.push(`/tickets/${ticket.id}`)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-primary">{ticket.ticketNumber}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.customer.name}</p>
                            <p className="text-xs text-gray-500">{ticket.customer.phone}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {ticket.deviceBrand} {ticket.deviceModel}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.gradient} text-white`}>
                              <config.Icon className="h-3.5 w-3.5" />
                              {t(ticket.status.toLowerCase()) || config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.color}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-base font-semibold text-gray-900 dark:text-white">
                              ${(ticket.finalPrice ?? ticket.estimatedPrice).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={{
                    pathname: '/tickets',
                    query: {
                      ...(status && { status }),
                      ...(search && { search }),
                      page: currentPage > 1 ? currentPage - 1 : 1,
                    },
                  }}
                >
                  <button
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                    {t('previous') || 'Previous'}
                  </button>
                </Link>
                <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <Link
                  href={{
                    pathname: '/tickets',
                    query: {
                      ...(status && { status }),
                      ...(search && { search }),
                      page: currentPage < totalPages ? currentPage + 1 : totalPages,
                    },
                  }}
                >
                  <button
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {t('next') || 'Next'}
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewTicketWizard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

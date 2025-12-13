'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';
import { InventoryAdjustmentFormModal } from '@/components/finance/InventoryAdjustmentFormModal';
import {
    ArrowLeftIcon,
    RectangleStackIcon,
    TableCellsIcon,
    PlusIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ShoppingBagIcon,
    ArrowsRightLeftIcon,
    MagnifyingGlassIcon,
    PlusCircleIcon,
    MinusCircleIcon,
    ArrowPathIcon,
    CubeIcon,
    CalendarDaysIcon,
    CurrencyDollarIcon,
    ClockIcon,
    UserIcon,
    LinkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { ComponentType, SVGProps } from 'react';

interface InventoryAdjustment {
    id: string;
    partId: string;
    qtyChange: number;
    cost: number;
    costPerUnit: number | null;
    reason: string;
    relatedReturnId: string | null;
    createdAt: string;
    part: {
        name: string;
        sku: string;
        quantity: number;
        supplier: {
            id: string;
            name: string;
        } | null;
    };
    createdByUser: {
        name: string | null;
        username: string;
    };
}

const adjustmentTypeConfig = {
    increase: {
        Icon: PlusCircleIcon,
        gradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
    },
    decrease: {
        Icon: MinusCircleIcon,
        gradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
    },
};

export default function InventoryAdjustmentsPage() {
    const { t } = useLanguage();
    const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'increase' | 'decrease'>('all');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const limit = 25;

    const fetchAdjustments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await fetch(`/api/v2/inventory-adjustments?${params}`);
            if (!response.ok) throw new Error('Failed to fetch inventory adjustments');

            const data = await response.json();
            setAdjustments(data.data);
            setTotal(data.pagination.total);
        } catch (error) {
            console.error('Error fetching inventory adjustments:', error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchAdjustments();
    }, [fetchAdjustments]);

    // Calculate stats
    const stats = useMemo(() => {
        const increases = adjustments.filter((a) => a.qtyChange > 0);
        const decreases = adjustments.filter((a) => a.qtyChange < 0);
        const totalIncrease = increases.reduce((acc, a) => acc + a.qtyChange, 0);
        const totalDecrease = decreases.reduce((acc, a) => acc + Math.abs(a.qtyChange), 0);
        const totalCostIn = increases.reduce((acc, a) => acc + a.cost, 0);
        const totalCostOut = decreases.reduce((acc, a) => acc + a.cost, 0);

        return {
            increases: increases.length,
            decreases: decreases.length,
            totalIncrease,
            totalDecrease,
            totalCostIn,
            totalCostOut,
            netChange: totalIncrease - totalDecrease,
        };
    }, [adjustments]);

    // Filter adjustments
    const filteredAdjustments = useMemo(() => {
        let filtered = adjustments;

        if (typeFilter === 'increase') {
            filtered = filtered.filter((a) => a.qtyChange > 0);
        } else if (typeFilter === 'decrease') {
            filtered = filtered.filter((a) => a.qtyChange < 0);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (a) =>
                    a.part.name.toLowerCase().includes(term) ||
                    a.part.sku.toLowerCase().includes(term) ||
                    a.reason.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [adjustments, typeFilter, searchTerm]);

    // Group adjustments by date
    const groupedAdjustments = useMemo(() => {
        const groups: Record<string, InventoryAdjustment[]> = {};
        filteredAdjustments.forEach((adjustment) => {
            const date = new Date(adjustment.createdAt).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(adjustment);
        });
        return groups;
    }, [filteredAdjustments]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/inventory/stock"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-6 group"
                    >
                        <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">{t('inventory.backToInventory')}</span>
                    </Link>

                    <div className="flex-stack lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-fluid-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                {t('finance.inventory') || 'Inventory Adjustments'}
                            </h1>
                            <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl">
                                {t('finance.inventory.pageDescription')}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-theme-sm">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <RectangleStackIcon className="h-[18px] w-[18px]" />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <TableCellsIcon className="h-[18px] w-[18px]" />
                                </button>
                            </div>

                            {/* Add Button */}
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
                            >
                                <PlusIcon className="h-5 w-5" />
                                {t('finance.inventory.addAdjustment')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid-stats mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <ArrowUpIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.inventory.stockIn') || 'Stock In'}</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{stats.totalIncrease}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                                <ArrowDownIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.inventory.stockOut') || 'Stock Out'}</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">-{stats.totalDecrease}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <ShoppingBagIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.inventory.costIn') || 'Cost (In)'}</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${stats.totalCostIn.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stats.netChange >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'} flex items-center justify-center`}>
                                <ArrowsRightLeftIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.inventory.netChange') || 'Net Change'}</p>
                                <p className={`text-2xl font-bold ${stats.netChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {stats.netChange >= 0 ? '+' : ''}{stats.netChange}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
                    <div className="flex-stack items-start lg:items-center">
                        {/* Search */}
                        <div className="flex-1 w-full lg:w-auto">
                            <div className="relative">
                                <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by part name, SKU, or reason..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Type Filter Pills */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setTypeFilter('all')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${typeFilter === 'all'
                                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                All ({adjustments.length})
                            </button>
                            <button
                                onClick={() => setTypeFilter('increase')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${typeFilter === 'increase'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <PlusCircleIcon className="h-[18px] w-[18px]" />
                                Stock In ({stats.increases})
                            </button>
                            <button
                                onClick={() => setTypeFilter('decrease')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${typeFilter === 'decrease'
                                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <MinusCircleIcon className="h-[18px] w-[18px]" />
                                Stock Out ({stats.decreases})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
                            <ArrowPathIcon className="h-8 w-8 text-white animate-spin" />
                        </div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">{t('finance.inventory.loading')}</p>
                    </div>
                ) : filteredAdjustments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-6">
                            <CubeIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('finance.inventory.noAdjustments')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">No inventory adjustments found for the selected filters.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
                        >
                            <PlusIcon className="h-5 w-5" />
                            {t('finance.inventory.addAdjustment')}
                        </button>
                    </div>
                ) : viewMode === 'cards' ? (
                    /* Timeline Cards View */
                    <div className="space-y-6">
                        {Object.entries(groupedAdjustments).map(([date, dateAdjustments]) => {
                            const dayIn = dateAdjustments.filter((a) => a.qtyChange > 0).reduce((acc, a) => acc + a.qtyChange, 0);
                            const dayOut = dateAdjustments.filter((a) => a.qtyChange < 0).reduce((acc, a) => acc + Math.abs(a.qtyChange), 0);

                            return (
                                <div key={date}>
                                    {/* Date Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{date}</p>
                                            <p className="text-xs text-gray-500">{dateAdjustments.length} adjustment{dateAdjustments.length > 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-4" />
                                        <div className="flex items-center gap-3 text-sm font-medium">
                                            {dayIn > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{dayIn}</span>}
                                            {dayOut > 0 && <span className="text-red-600 dark:text-red-400">-{dayOut}</span>}
                                        </div>
                                    </div>

                                    {/* Adjustment Cards */}
                                    <div className="grid-cards ml-5 pl-8 border-l-2 border-gray-200 dark:border-gray-700">
                                        {dateAdjustments.map((adjustment) => {
                                            const isIncrease = adjustment.qtyChange > 0;
                                            const config = isIncrease ? adjustmentTypeConfig.increase : adjustmentTypeConfig.decrease;

                                            return (
                                                <div
                                                    key={adjustment.id}
                                                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-theme-lg hover:border-primary/20 transition-all duration-300"
                                                >
                                                    <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

                                                    <div className="p-5">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                                                                    <config.Icon className="h-5 w-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-900 dark:text-white">{adjustment.part.name}</p>
                                                                    <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-mono rounded">
                                                                        {adjustment.part.sku}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="text-right">
                                                                <p className={`text-xl font-bold ${config.text}`}>
                                                                    {isIncrease ? '+' : ''}{adjustment.qtyChange}
                                                                </p>
                                                                <p className="text-xs text-gray-500">{t('finance.inventory.units')}</p>
                                                            </div>
                                                        </div>

                                                        {/* Reason */}
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{adjustment.reason}</p>

                                                        {/* Meta Info */}
                                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <CurrencyDollarIcon className="h-[18px] w-[18px] text-gray-400" />
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">{t('finance.inventory.totalCost')}</p>
                                                                        <p className={`font-semibold ${isIncrease ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                            ${adjustment.cost.toFixed(2)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <CubeIcon className="h-[18px] w-[18px] text-gray-400" />
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">{t('finance.currentStock')}</p>
                                                                        <p className="font-semibold text-gray-900 dark:text-white">{adjustment.part.quantity}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                    <ClockIcon className="h-4 w-4" />
                                                                    {new Date(adjustment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                    <UserIcon className="h-4 w-4" />
                                                                    {adjustment.createdByUser.name || adjustment.createdByUser.username}
                                                                </div>
                                                            </div>

                                                            {adjustment.relatedReturnId && (
                                                                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                                    <LinkIcon className="h-4 w-4 text-blue-500" />
                                                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('finance.linkedToReturn')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
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
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.expenses.part')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.inventory.sku')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.qtyChange')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.inventory.totalCost')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.costPerUnit')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.currentStock')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.reason')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.date')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('finance.expenses.createdBy')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredAdjustments.map((adjustment) => {
                                        const isIncrease = adjustment.qtyChange > 0;
                                        const config = isIncrease ? adjustmentTypeConfig.increase : adjustmentTypeConfig.decrease;

                                        return (
                                            <tr key={adjustment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900 dark:text-white">{adjustment.part.name}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-mono rounded">
                                                        {adjustment.part.sku}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 text-base font-semibold ${config.text}`}>
                                                        {isIncrease ? <PlusIcon className="h-[18px] w-[18px]" /> : <MinusCircleIcon className="h-[18px] w-[18px]" />}
                                                        {Math.abs(adjustment.qtyChange)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`font-medium ${isIncrease ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        ${adjustment.cost.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                    ${(adjustment.costPerUnit || 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-full">
                                                        {adjustment.part.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{adjustment.reason}</p>
                                                    {adjustment.relatedReturnId && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-500">
                                                            <LinkIcon className="h-4 w-4" />
                                                            {t('finance.linkedToReturn')}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="text-sm text-gray-900 dark:text-white">{new Date(adjustment.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-500">{new Date(adjustment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                    {adjustment.createdByUser.name || adjustment.createdByUser.username}
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
                {total > 0 && (
                    <div className="mt-6 flex-stack bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('finance.inventory.showing', { from: (page - 1) * limit + 1, to: Math.min(page * limit, total), total })}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                <ChevronLeftIcon className="h-[18px] w-[18px]" />
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Page {page} of {Math.ceil(total / limit)}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page * limit >= total}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                Next
                                <ChevronRightIcon className="h-[18px] w-[18px]" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Add Adjustment Modal */}
                {showAddModal && (
                    <InventoryAdjustmentFormModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchAdjustments();
                        }}
                    />
                )}
            </div>
        </div>
    );
}

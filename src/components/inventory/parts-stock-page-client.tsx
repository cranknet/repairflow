'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PartsStockSearch } from '@/components/inventory/parts-stock-search';
import { PartFormModal } from '@/components/finance/PartFormModal';
import { ReceiptScanner } from '@/components/inventory/receipt-scanner';
import { useLanguage } from '@/contexts/language-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface Part {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  supplierId: string | null;
  supplier: {
    id: string;
    name: string;
  } | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface PartsStockPageClientProps {
  parts: Part[];
  suppliers: Supplier[];
  search?: string;
  supplierId?: string;
  userRole: string;
}

const stockStatusConfig = {
  outOfStock: {
    label: 'Out of Stock',
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    icon: 'error',
  },
  lowStock: {
    label: 'Low Stock',
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'warning',
  },
  inStock: {
    label: 'In Stock',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: 'check_circle',
  },
};

export function PartsStockPageClient({
  parts,
  suppliers,
  search,
  supplierId,
  userRole,
}: PartsStockPageClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [viewingPart, setViewingPart] = useState<Part | null>(null);
  const [deletingPart, setDeletingPart] = useState<Part | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);

  const handleSuccess = () => {
    router.refresh();
    setIsModalOpen(false);
    setEditingPart(null);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleExport = () => {
    const headers = ['Name', 'SKU', 'Description', 'Quantity', 'Reorder Level', 'Unit Price', 'Supplier'];
    const rows = parts.map((part) => [
      part.name,
      part.sku,
      part.description || '',
      part.quantity.toString(),
      part.reorderLevel.toString(),
      part.unitPrice.toFixed(2),
      part.supplier?.name || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `parts-stock-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPart) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/parts/${deletingPart.id}`, { method: 'DELETE' });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(errorData.error || 'Delete failed');
      }

      toast({
        title: t('success') || 'Success',
        description: t('partDeleted') || 'Part deleted successfully',
      });
      router.refresh();
      setDeletingPart(null);
    } catch (error) {
      toast({
        title: t('error') || 'Error',
        description: error instanceof Error ? error.message : (t('partDeleteFailed') || 'Failed to delete part'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return 'outOfStock';
    if (quantity <= reorderLevel) return 'lowStock';
    return 'inStock';
  };

  // Calculate stats
  const stats = useMemo(() => {
    const inStock = parts.filter((p) => p.quantity > p.reorderLevel);
    const lowStock = parts.filter((p) => p.quantity > 0 && p.quantity <= p.reorderLevel);
    const outOfStock = parts.filter((p) => p.quantity === 0);
    const totalValue = parts.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0);
    const totalUnits = parts.reduce((acc, p) => acc + p.quantity, 0);

    return {
      total: parts.length,
      inStock: inStock.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      totalValue,
      totalUnits,
    };
  }, [parts]);

  // Filter parts
  const filteredParts = useMemo(() => {
    if (stockFilter === 'all') return parts;
    return parts.filter((p) => getStockStatus(p.quantity, p.reorderLevel) === stockFilter);
  }, [parts, stockFilter]);

  const isAdmin = userRole === 'ADMIN';

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-cyan-950">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {t('inventory.stock') || 'Parts in Stock'}
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl">
                  {t('managePartsStock') || 'Manage your inventory parts and stock levels'}
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
                    <span className="material-symbols-outlined text-lg">grid_view</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <span className="material-symbols-outlined text-lg">table_rows</span>
                  </button>
                </div>

                {/* Actions */}
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-theme-sm border border-gray-200 dark:border-gray-700"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={() => setShowReceiptScanner(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-theme-sm border border-gray-200 dark:border-gray-700"
                  title={t('receiptScanner.scanReceipt') || 'Scan Receipt'}
                >
                  <span className="material-symbols-outlined text-lg">document_scanner</span>
                  <span className="hidden sm:inline">{t('receiptScanner.scanReceipt') || 'Scan Receipt'}</span>
                </button>

                <Link
                  href="/inventory/inventory-adjustments"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-theme-sm border border-gray-200 dark:border-gray-700"
                >
                  <span className="material-symbols-outlined text-lg">swap_vert</span>
                  <span className="hidden sm:inline">{t('inventory.adjustments') || 'Adjustments'}</span>
                </Link>

                {isAdmin && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
                  >
                    <span className="material-symbols-outlined">add</span>
                    {t('addPart') || 'Add Part'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">inventory_2</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Parts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.inStock') || 'In Stock'}</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.inStock}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-white text-2xl">warning</span>
                  {stats.lowStock > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {stats.lowStock}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.lowStock') || 'Low Stock'}</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.lowStock}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">cancel</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.outOfStock}</p>
                </div>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">attach_money</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">${stats.totalValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search */}
              <div className="flex-1 w-full lg:w-auto">
                <PartsStockSearch suppliers={suppliers} />
              </div>

              {/* Stock Filter Pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${stockFilter === 'all'
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setStockFilter('inStock')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${stockFilter === 'inStock'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  In Stock ({stats.inStock})
                </button>
                <button
                  onClick={() => setStockFilter('lowStock')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${stockFilter === 'lowStock'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">warning</span>
                  Low Stock ({stats.lowStock})
                </button>
                <button
                  onClick={() => setStockFilter('outOfStock')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${stockFilter === 'outOfStock'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  Out ({stats.outOfStock})
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {filteredParts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">inventory_2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('noPartsFound') || 'No parts found'}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                {search ? 'Try adjusting your search or filters' : 'Start by adding your first part to the inventory'}
              </p>
              {isAdmin && !search && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all font-medium"
                >
                  <span className="material-symbols-outlined">add</span>
                  {t('addPart') || 'Add Part'}
                </button>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredParts.map((part) => {
                const status = getStockStatus(part.quantity, part.reorderLevel);
                const config = stockStatusConfig[status];

                return (
                  <div
                    key={part.id}
                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-theme-lg hover:border-primary/20 transition-all duration-300"
                  >
                    <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                            <span className="material-symbols-outlined text-white text-xl">{config.icon}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{part.name}</p>
                            <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-mono rounded">
                              {part.sku}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>{config.label}</span>
                      </div>

                      {part.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{part.description}</p>}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-center">
                          <p className={`text-xl font-bold ${config.text}`}>{part.quantity}</p>
                          <p className="text-xs text-gray-500">In Stock</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{part.reorderLevel}</p>
                          <p className="text-xs text-gray-500">Min Level</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-violet-600 dark:text-violet-400">${part.unitPrice.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Unit Price</p>
                        </div>
                      </div>

                      {/* Supplier & Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {part.supplier ? (
                            <>
                              <span className="material-symbols-outlined text-lg">local_shipping</span>
                              <span>{part.supplier.name}</span>
                            </>
                          ) : (
                            <span className="text-gray-400">No supplier</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewingPart(part)}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="View"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingPart(part)}
                                className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Edit"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() => setDeletingPart(part)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Part</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredParts.map((part) => {
                      const status = getStockStatus(part.quantity, part.reorderLevel);
                      const config = stockStatusConfig[status];

                      return (
                        <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-white">{part.name}</p>
                            {part.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{part.description}</p>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-mono rounded">{part.sku}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-semibold ${config.text}`}>{part.quantity}</span>
                              <span className="text-xs text-gray-400">/ {part.reorderLevel} min</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config.gradient} text-white`}>
                              <span className="material-symbols-outlined text-sm">{config.icon}</span>
                              {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-violet-600 dark:text-violet-400">${part.unitPrice.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{part.supplier?.name || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewingPart(part)}
                                className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => setEditingPart(part)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                  </button>
                                  <button
                                    onClick={() => setDeletingPart(part)}
                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Part Modal */}
      {(isModalOpen || editingPart) && (
        <PartFormModal
          part={editingPart || undefined}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPart(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* View Part Dialog */}
      <Dialog open={!!viewingPart} onOpenChange={() => setViewingPart(null)}>
        <DialogContent className="max-w-md">
          {viewingPart && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stockStatusConfig[getStockStatus(viewingPart.quantity, viewingPart.reorderLevel)].gradient} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white">{stockStatusConfig[getStockStatus(viewingPart.quantity, viewingPart.reorderLevel)].icon}</span>
                  </div>
                  {viewingPart.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">SKU</p>
                    <p className="font-mono text-sm">{viewingPart.sku}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                    <p className="font-semibold text-violet-600">${viewingPart.unitPrice.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">In Stock</p>
                    <p className={`font-semibold ${stockStatusConfig[getStockStatus(viewingPart.quantity, viewingPart.reorderLevel)].text}`}>{viewingPart.quantity}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Reorder Level</p>
                    <p className="font-semibold">{viewingPart.reorderLevel}</p>
                  </div>
                </div>
                {viewingPart.description && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm">{viewingPart.description}</p>
                  </div>
                )}
                {viewingPart.supplier && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Supplier</p>
                    <p className="text-sm">{viewingPart.supplier.name}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPart} onOpenChange={() => setDeletingPart(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <span className="material-symbols-outlined">warning</span>
              Delete Part
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingPart?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setDeletingPart(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Scanner Modal */}
      <Dialog open={showReceiptScanner} onOpenChange={setShowReceiptScanner}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('receiptScanner.title') || 'Receipt Scanner'}</DialogTitle>
          </DialogHeader>
          <ReceiptScanner
            onComplete={() => {
              setShowReceiptScanner(false);
              handleRefresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

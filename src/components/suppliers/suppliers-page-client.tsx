'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SupplierSearch } from '@/components/suppliers/supplier-search';
import { SupplierFormModal } from '@/components/finance/SupplierFormModal';
import { useLanguage } from '@/contexts/language-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  _count: {
    parts: number;
  };
}

interface SuppliersPageClientProps {
  suppliers: Supplier[];
  search?: string;
  userRole: string;
}

export function SuppliersPageClient({ suppliers, search, userRole }: SuppliersPageClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSuccess = (supplier?: { id: string; name: string }) => {
    router.refresh();
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSupplier) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/suppliers/${deletingSupplier.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.refresh();
      setDeletingSupplier(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalParts = suppliers.reduce((acc, s) => acc + s._count.parts, 0);
    const activeSuppliers = suppliers.filter((s) => s._count.parts > 0);
    const newThisMonth = suppliers.filter((s) => {
      const created = new Date(s.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    });

    return {
      total: suppliers.length,
      active: activeSuppliers.length,
      newThisMonth: newThisMonth.length,
      totalParts,
    };
  }, [suppliers]);

  const isAdmin = userRole === 'ADMIN';

  // Generate avatar initials and colors
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-emerald-500 to-teal-600',
      'from-blue-500 to-indigo-600',
      'from-violet-500 to-purple-600',
      'from-pink-500 to-rose-600',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-blue-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  {t('relations.suppliers') || 'Suppliers'}
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl">
                  {t('manageSuppliers') || 'Manage your supplier relationships and parts inventory'}
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

                {isAdmin && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium"
                  >
                    <span className="material-symbols-outlined">add_business</span>
                    {t('addSupplier') || 'Add Supplier'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">local_shipping</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Suppliers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">verified</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">add_business</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">New This Month</p>
                  <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.newThisMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">inventory_2</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Parts</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalParts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
            <SupplierSearch />
          </div>

          {/* Content */}
          {suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">local_shipping</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('noSuppliersFound') || 'No suppliers found'}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                {search ? 'Try adjusting your search terms' : 'Add your first supplier to get started'}
              </p>
              {isAdmin && !search && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium"
                >
                  <span className="material-symbols-outlined">add_business</span>
                  {t('addSupplier') || 'Add Supplier'}
                </button>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-theme-lg hover:border-emerald-500/20 transition-all duration-300"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getAvatarColor(supplier.name)} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <span className="text-white text-lg font-bold">{getInitials(supplier.name)}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/suppliers/${supplier.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 transition-colors block truncate">
                          {supplier.name}
                        </Link>
                        {supplier.contactPerson && (
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                            <span className="material-symbols-outlined text-base">person</span>
                            <span>{supplier.contactPerson}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-500">
                            <span className="material-symbols-outlined text-base">phone</span>
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Parts Badge */}
                      <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-lg">
                        {supplier._count.parts} parts
                      </span>
                    </div>

                    {/* Contact Info */}
                    {(supplier.email || supplier.address) && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 truncate">
                            <span className="material-symbols-outlined text-base">mail</span>
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.address && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 truncate">
                            <span className="material-symbols-outlined text-base">location_on</span>
                            <span className="truncate">{supplier.address}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          title="View"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setEditingSupplier(supplier)}
                              className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => setDeletingSupplier(supplier)}
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
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Person</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parts</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarColor(supplier.name)} flex items-center justify-center`}>
                              <span className="text-white text-sm font-bold">{getInitials(supplier.name)}</span>
                            </div>
                            <Link href={`/suppliers/${supplier.id}`} className="font-medium text-gray-900 dark:text-white hover:text-emerald-600 transition-colors">
                              {supplier.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{supplier.contactPerson || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{supplier.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{supplier.email || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-lg">
                            <span className="material-symbols-outlined text-sm">inventory_2</span>
                            {supplier._count.parts}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/suppliers/${supplier.id}`}
                              className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </Link>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => setEditingSupplier(supplier)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                  onClick={() => setDeletingSupplier(supplier)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Supplier Modal */}
      {(isModalOpen || editingSupplier) && (
        <SupplierFormModal
          supplier={editingSupplier || undefined}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSupplier(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSupplier} onOpenChange={() => setDeletingSupplier(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <span className="material-symbols-outlined">warning</span>
              Delete Supplier
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingSupplier?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setDeletingSupplier(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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
    </>
  );
}

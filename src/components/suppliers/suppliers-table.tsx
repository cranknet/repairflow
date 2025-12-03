'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/use-toast';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { EditSupplierModal } from './edit-supplier-modal';

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

interface SuppliersTableProps {
  suppliers: Supplier[];
  userRole: string;
}

export function SuppliersTable({ suppliers, userRole }: SuppliersTableProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsEditModalOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/suppliers/${supplierToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = error.error || t('suppliers.delete_failed');
        
        // Handle specific error cases
        if (response.status === 403) {
          errorMessage = t('suppliers.delete_forbidden');
        } else if (response.status === 400 && error.error?.includes('parts')) {
          errorMessage = error.error;
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: t('success'),
        description: t('suppliers.delete_success'),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('suppliers.delete_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setSupplierToDelete(null);
    }
  };

  const handleEditSuccess = () => {
    router.refresh();
    setIsEditModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('supplierName')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('contactPerson')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('email')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('phone')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('totalParts')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('createdAt')}
            </th>
            {userRole === 'ADMIN' && (
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                {t('actions')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr
              key={supplier.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="py-3 px-4 font-medium">{supplier.name}</td>
              <td className="py-3 px-4">{supplier.contactPerson || '-'}</td>
              <td className="py-3 px-4">{supplier.email || '-'}</td>
              <td className="py-3 px-4">{supplier.phone || '-'}</td>
              <td className="py-3 px-4">{supplier._count.parts}</td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                <span suppressHydrationWarning>
                  {format(new Date(supplier.createdAt), 'MMM dd, yyyy')}
                </span>
              </td>
              {userRole === 'ADMIN' && (
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/suppliers/${supplier.id}`}>
                      <Button
                        variant="outlined"
                        size="sm"
                        icon={<EyeIcon className="h-4 w-4" />}
                        aria-label={`${t('view')} ${supplier.name}`}
                      >
                        {t('view')}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                      icon={<PencilIcon className="h-4 w-4" />}
                      className="text-blue-600 hover:text-blue-700"
                      aria-label={`${t('edit')} ${supplier.name}`}
                    >
                      {t('edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(supplier);
                      }}
                      disabled={supplier._count.parts > 0}
                      aria-disabled={supplier._count.parts > 0}
                      aria-label={`${t('delete')} ${supplier.name}`}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:hover:text-gray-400"
                      icon={<TrashIcon className="h-4 w-4" />}
                      title={
                        supplier._count.parts > 0
                          ? t('suppliers.delete_disabled_has_parts')
                          : t('delete')
                      }
                    >
                      {t('delete')}
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {isEditModalOpen && editingSupplier && (
        <EditSupplierModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSupplier(null);
          }}
          supplier={editingSupplier}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t('suppliers.delete_title').replace('{name}', supplierToDelete.name)}
          description={`${t('suppliers.delete_description')} ${t('supplierName')}: ${supplierToDelete.name}, ${supplierToDelete.email ? `${t('email')}: ${supplierToDelete.email}, ` : ''}${t('totalParts')}: ${supplierToDelete._count.parts}`}
          confirmText={t('delete')}
          cancelText={t('cancel')}
          variant="destructive"
          onConfirm={confirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}


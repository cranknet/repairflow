'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { EditCustomerModal } from './edit-customer-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/use-toast';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CustomersTableProps {
  customers: any[];
  userRole: string;
}

export function CustomersTable({ customers, userRole }: CustomersTableProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleDelete = (customer: any) => {
    setCustomerToDelete(customer);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/customers/${customerToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = error.error || t('customers.delete_failed');
        
        // Handle specific error cases
        if (response.status === 403) {
          errorMessage = t('customers.delete_forbidden');
        } else if (response.status === 400 && error.error?.includes('tickets')) {
          errorMessage = t('customers.delete_failed');
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: t('success'),
        description: t('customers.delete_success'),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('customers.delete_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleEditSuccess = () => {
    router.refresh();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('customerName')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('customerPhone')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('customerEmail')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('totalTickets')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('createdAt')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="py-3 px-4 font-medium">{customer.name}</td>
              <td className="py-3 px-4">{customer.phone}</td>
              <td className="py-3 px-4">{customer.email || '-'}</td>
              <td className="py-3 px-4">{customer._count.tickets}</td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                <span suppressHydrationWarning>
                  {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Link href={`/customers/${customer.id}`}>
                    <Button
                      variant="outlined"
                      size="sm"
                      icon={<EyeIcon className="h-4 w-4" />}
                      aria-label={`${t('customers.action.view')} ${customer.name}`}
                    >
                      {t('customers.action.view')}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(customer)}
                    icon={<PencilIcon className="h-4 w-4" />}
                    className="text-blue-600 hover:text-blue-700"
                    aria-label={`${t('customers.action.edit')} ${customer.name}`}
                  >
                    {t('customers.action.edit')}
                  </Button>
                  {userRole === 'ADMIN' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(customer);
                      }}
                      disabled={customer._count.tickets > 0}
                      aria-disabled={customer._count.tickets > 0}
                      aria-label={`${t('customers.action.delete')} ${customer.name}`}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:hover:text-gray-400"
                      icon={<TrashIcon className="h-4 w-4" />}
                      title={
                        customer._count.tickets > 0
                          ? t('customers.action.delete_disabled_has_tickets')
                          : t('customers.action.delete')
                      }
                    >
                      {t('customers.action.delete')}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t('customers.modal.delete_title').replace('{name}', customerToDelete.name)}
          description={`${t('customers.modal.delete_body')} ${t('customerName')}: ${customerToDelete.name}, ${customerToDelete.email ? `${t('customerEmail')}: ${customerToDelete.email}, ` : ''}${t('customerPhone')}: ${customerToDelete.phone}, ${t('totalTickets')}: ${customerToDelete._count.tickets}`}
          confirmText={t('customers.action.delete')}
          cancelText={t('cancel')}
          variant="destructive"
          onConfirm={confirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}


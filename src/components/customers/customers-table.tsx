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
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CustomersTableProps {
  customers: any[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleDelete = (customerId: string) => {
    setCustomerToDelete(customerId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/customers/${customerToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete customer');
      }

      toast({
        title: t('success'),
        description: 'Customer deleted successfully',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to delete customer',
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
                {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Link href={`/customers/${customer.id}`}>
                    <Button variant="ghost" size="sm">
                      {t('view')}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(customer)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={customer._count.tickets > 0}
                    title={customer._count.tickets > 0 ? 'Cannot delete customer with tickets' : 'Delete customer'}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
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

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('delete') + ' Customer'}
        description="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}


'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface ReturnsTableProps {
  returns: any[];
  userRole: string;
}

export function ReturnsTable({ returns, userRole }: ReturnsTableProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = userRole === 'ADMIN';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return t('approved');
      case 'REJECTED':
        return t('rejected');
      case 'PENDING':
        return t('pending');
      default:
        return status;
    }
  };

  const handleApprove = async (returnId: string) => {
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (!response.ok) throw new Error('Failed to approve return');

      toast({
        title: t('success'),
        description: t('returnApprovedTicketStatusChanged'),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToApproveReturn'),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (returnId: string) => {
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (!response.ok) throw new Error('Failed to reject return');

      toast({
        title: t('success'),
        description: t('returnRejectedTicketRemainsRepaired'),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToRejectReturn'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (returnId: string) => {
    setReturnToDelete(returnId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!returnToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/returns/${returnToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete return');
      }

      toast({
        title: t('success'),
        description: t('returnDeletedSuccessfully'),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('failedToDeleteReturn'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setReturnToDelete(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('ticketNumber')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('customer')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('refundAmount')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('reason')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('status')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('ticketStatus')}
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
          {returns.map((returnRecord) => (
            <tr
              key={returnRecord.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="py-3 px-4">
                <Link
                  href={`/tickets/${returnRecord.ticketId}`}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {returnRecord.ticket.ticketNumber}
                </Link>
              </td>
              <td className="py-3 px-4">
                <div>
                  <div className="font-medium">{returnRecord.ticket.customer.name}</div>
                  <div className="text-sm text-gray-500">{returnRecord.ticket.customer.phone}</div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ${returnRecord.refundAmount?.toFixed(2) || '0.00'}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {returnRecord.reason}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(returnRecord.status)}`}
                >
                  {getStatusText(returnRecord.status)}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {returnRecord.ticket.status}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(returnRecord.createdAt), 'MMM dd, yyyy HH:mm')}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {returnRecord.status === 'PENDING' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(returnRecord.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        {t('approve')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(returnRecord.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        {t('reject')}
                      </Button>
                    </>
                  )}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(returnRecord.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={isDeleting}
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      {t('delete')}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('deleteReturn')}
        description={t('deleteReturnConfirmation')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { formatId } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TicketStatusBadge } from './ticket-status-badge';
import { EyeIcon, TrashIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { TicketPaymentModal } from './ticket-payment-modal';

interface TicketsTableProps {
  tickets: any[];
  userRole: string;
}

export function TicketsTable({ tickets, userRole }: TicketsTableProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [ticketToPay, setTicketToPay] = useState<any>(null);

  const handleDelete = (ticket: any) => {
    setTicketToDelete(ticket);
    setDeleteConfirmOpen(true);
  };

  const handlePay = (ticket: any) => {
    setTicketToPay(ticket);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setTicketToPay(null);
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!ticketToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tickets/${ticketToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = error.error || t('tickets.delete.error');

        // Handle specific error cases
        if (response.status === 403) {
          errorMessage = t('tickets.delete.errorPermission');
        } else if (response.status === 400 && error.error?.includes('returns')) {
          errorMessage = t('tickets.delete.errorWithReturns');
        }

        throw new Error(errorMessage);
      }

      toast({
        title: t('success'),
        description: t('tickets.delete.success'),
      });

      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('tickets.delete.error'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setTicketToDelete(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityTranslation = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'LOW': t('low'),
      'MEDIUM': t('medium'),
      'HIGH': t('high'),
      'URGENT': t('urgent'),
    };
    return priorityMap[priority] || priority;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('ticketNumber')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('customer')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('device')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('status')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('priority')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('finalPrice') || t('price')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('paymentStatus') || t('payment')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('createdAt')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('satisfaction.rating_label')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="py-3 px-4">
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="font-medium text-primary-600 hover:underline"
                >
                  {formatId(ticket.ticketNumber)}
                </Link>
              </td>
              <td className="py-3 px-4">{ticket.customer.name}</td>
              <td className="py-3 px-4">
                {ticket.deviceBrand} {ticket.deviceModel}
              </td>
              <td className="py-3 px-4">
                <TicketStatusBadge
                  status={ticket.status}
                  hasPendingReturn={(ticket as any).hasPendingReturn || false}
                />
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                    ticket.priority
                  )}`}
                >
                  {getPriorityTranslation(ticket.priority)}
                </span>
              </td>
              <td className="py-3 px-4">${(ticket.finalPrice ?? ticket.estimatedPrice).toFixed(2)}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${ticket.paid
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}
                >
                  {ticket.paid ? t('paid') : t('unpaid')}
                </span>
              </td>
              <td className="py-3 px-4">
                {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
              </td>
              <td className="py-3 px-4">
                {ticket.satisfactionRating ? (
                  <div className="flex items-center gap-1" title={`${ticket.satisfactionRating.rating}/5 ${ticket.satisfactionRating.comment ? `- ${ticket.satisfactionRating.comment}` : ''}`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      star <= ticket.satisfactionRating.rating ? (
                        <StarIcon key={star} className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <StarOutlineIcon key={star} className="h-4 w-4 text-gray-300" />
                      )
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Link href={`/tickets/${ticket.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<EyeIcon className="h-4 w-4" />}
                      aria-label={`${t('tickets.action.view')} ${ticket.ticketNumber}`}
                    >
                      {t('tickets.action.view')}
                    </Button>
                  </Link>
                  {(userRole === 'ADMIN' || userRole === 'STAFF') &&
                    ticket.status === 'REPAIRED' &&
                    !ticket.paid &&
                    (ticket.outstandingAmount ?? (ticket.finalPrice ?? ticket.estimatedPrice) - (ticket.totalPaid ?? 0)) > 0.01 && (
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePay(ticket);
                        }}
                        icon={<BanknotesIcon className="h-4 w-4" />}
                        aria-label={`${t('tickets.action.pay')} ${ticket.ticketNumber}`}
                      >
                        {t('tickets.action.pay')}
                      </Button>
                    )}
                  {userRole === 'ADMIN' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ticket);
                      }}
                      disabled={ticket.status === 'REPAIRED' || ticket.status === 'RETURNED'}
                      aria-disabled={ticket.status === 'REPAIRED' || ticket.status === 'RETURNED'}
                      aria-label={`${t('tickets.action.delete')} ${ticket.ticketNumber}`}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:hover:text-gray-400"
                      title={
                        ticket.status === 'REPAIRED' || ticket.status === 'RETURNED'
                          ? t('tickets.action.deleteDisabledRepairedReturned')
                          : t('tickets.action.delete')
                      }
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {ticketToDelete && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t('tickets.delete.confirmTitle').replace('{ticketNumber}', ticketToDelete.ticketNumber)}
          description={`${t('tickets.delete.confirmDescription')} ${t('ticketNumber')}: ${ticketToDelete.ticketNumber}, ${t('customer')}: ${ticketToDelete.customer.name}, ${t('device')}: ${ticketToDelete.deviceBrand} ${ticketToDelete.deviceModel}`}
          confirmText={t('tickets.delete.confirmButton')}
          cancelText={t('tickets.delete.cancelButton')}
          variant="destructive"
          onConfirm={confirmDelete}
        />
      )}

      {/* Payment Modal */}
      {ticketToPay && (
        <TicketPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setTicketToPay(null);
          }}
          ticket={{
            id: ticketToPay.id,
            ticketNumber: ticketToPay.ticketNumber,
            customer: ticketToPay.customer,
            deviceBrand: ticketToPay.deviceBrand,
            deviceModel: ticketToPay.deviceModel,
            finalPrice: ticketToPay.finalPrice,
            estimatedPrice: ticketToPay.estimatedPrice,
            outstandingAmount: ticketToPay.outstandingAmount,
            totalPaid: ticketToPay.totalPaid,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}


'use client';

import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { calculateReturnLoss } from '@/lib/loss-calculator';

interface ReturnsTableProps {
  returns: any[];
}

export function ReturnsTable({ returns }: ReturnsTableProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

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

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'GOOD':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'DAMAGED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'GOOD':
        return 'Good';
      case 'DAMAGED':
        return 'Damaged';
      default:
        return condition || 'Good';
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
        description: 'Return approved. Good parts restored to inventory, damaged parts recorded as loss.',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Failed to approve return',
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
        description: 'Return rejected',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Failed to reject return',
        variant: 'destructive',
      });
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
              {t('items')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Condition
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Loss Amount
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('reason')}
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              {t('status')}
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
                <div className="text-sm">
                  {returnRecord.items.map((item: any, idx: number) => (
                    <div key={idx}>
                      {item.part.name} (x{item.quantity})
                    </div>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="text-sm space-y-1">
                  {returnRecord.items.map((item: any, idx: number) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getConditionColor(item.condition || 'GOOD')}`}
                    >
                      {getConditionText(item.condition || 'GOOD')}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4">
                {(() => {
                  const lossAmount = calculateReturnLoss(returnRecord.items);
                  return (
                    <span className={`text-sm font-medium ${lossAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {lossAmount > 0 ? `$${lossAmount.toFixed(2)}` : 'No loss'}
                    </span>
                  );
                })()}
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
              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(returnRecord.createdAt), 'MMM dd, yyyy HH:mm')}
              </td>
              <td className="py-3 px-4">
                {returnRecord.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
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
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


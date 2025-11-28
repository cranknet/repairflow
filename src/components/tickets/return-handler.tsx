'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';

export function ReturnHandler({ ticket }: { ticket: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleApproveReturn = async (returnId: string) => {
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (!response.ok) throw new Error('Failed to approve return');

      toast({
        title: t('success'),
        description: t('returnApprovedMessage'),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToApproveReturn'),
      });
    }
  };

  const handleRejectReturn = async (returnId: string) => {
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (!response.ok) throw new Error('Failed to reject return');

      toast({
        title: t('success'),
        description: t('returnRejected'),
      });
      router.refresh();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToRejectReturn'),
      });
    }
  };

  // Show existing returns if any
  if (!ticket.returns || ticket.returns.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('returns')}</h3>
          <Link href="/returns">
            <Button size="sm" variant="outlined">
              {t('createReturn')}
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No returns for this ticket. Create a return from the{' '}
          <Link href="/returns" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
            returns page
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('returns')}</h3>
        <Link href="/returns">
          <Button size="sm" variant="outlined">
            {t('createReturn')}
          </Button>
        </Link>
      </div>

      {/* Existing Returns */}
      <div className="space-y-2">
        {ticket.returns.map((returnRecord: any) => (
          <Card key={returnRecord.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {t('returnNumber')}{returnRecord.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(returnRecord.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      returnRecord.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : returnRecord.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {returnRecord.status}
                  </span>
                </div>
                <p className="text-sm">
                  <span className="font-medium">{t('reason')}:</span> {returnRecord.reason}
                </p>
                {returnRecord.refundAmount && (
                  <p className="text-sm">
                    <span className="font-medium">Refund Amount:</span> ${returnRecord.refundAmount.toFixed(2)}
                  </p>
                )}
                {returnRecord.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApproveReturn(returnRecord.id)}
                      size="sm"
                      variant="outlined"
                    >
                      {t('approve')}
                    </Button>
                    <Button
                      onClick={() => handleRejectReturn(returnRecord.id)}
                      size="sm"
                      variant="outlined"
                    >
                      {t('reject')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

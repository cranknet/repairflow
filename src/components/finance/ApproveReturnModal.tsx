'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ArrowPathIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ApproveReturnModalProps {
    isOpen?: boolean;
    returnData: {
        id: string;
        refundAmount: number;
        ticketId: string;
        reason: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export function ApproveReturnModal({ isOpen = true, returnData, onClose, onSuccess }: ApproveReturnModalProps) {
    const { t } = useLanguage();
    const [partialAmount, setPartialAmount] = useState<string>(returnData.refundAmount.toString());
    const [notes, setNotes] = useState('');
    const [createInventoryAdj, setCreateInventoryAdj] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleApprove = async () => {
        setError('');
        setLoading(true);

        try {
            const amount = parseFloat(partialAmount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Invalid amount');
            }
            if (amount > returnData.refundAmount) {
                throw new Error('Amount cannot exceed requested refund');
            }

            const response = await fetch(`/api/v2/returns/${returnData.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partialAmount: amount !== returnData.refundAmount ? amount : undefined,
                    notes,
                    createInventoryAdjustment: createInventoryAdj,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to approve return');
            }

            onSuccess();
        } catch (error: any) {
            console.error('Error approving return:', error);
            setError(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const isPartialRefund = parseFloat(partialAmount) < returnData.refundAmount;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('finance.approveReturn.title')}</DialogTitle>
                    <DialogDescription>
                        {t('finance.approveReturn.description') || 'Review and approve this return request'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Error Alert */}
                    {error && (
                        <div className="p-3 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-600 dark:text-error-400 rounded-lg text-sm flex items-start gap-2">
                            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Return Reason Display */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">{t('finance.approveReturn.returnReason')}</p>
                        <p className="text-sm text-foreground">{returnData.reason}</p>
                    </div>

                    {/* Refund Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="approve-amount">
                            {t('finance.refundAmount')} <span className="text-error-500">*</span>
                        </Label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <Input
                                    id="approve-amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={returnData.refundAmount}
                                    value={partialAmount}
                                    onChange={(e) => setPartialAmount(e.target.value)}
                                    leadingIcon={<span className="text-muted-foreground">$</span>}
                                />
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                / ${returnData.refundAmount.toFixed(2)}
                            </span>
                        </div>
                        {isPartialRefund && (
                            <p className="text-xs text-warning-600 dark:text-warning-400 flex items-center gap-1">
                                <InformationCircleIcon className="h-3.5 w-3.5" />
                                {t('finance.approveReturn.partialRefund')}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="approve-notes">{t('finance.notes')}</Label>
                        <Textarea
                            id="approve-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('finance.approveReturn.notesPlaceholder')}
                            rows={3}
                        />
                    </div>

                    {/* Inventory Adjustment Option */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={createInventoryAdj}
                                onChange={(e) => setCreateInventoryAdj(e.target.checked)}
                                id="inventory-adj"
                                className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary focus:ring-offset-0"
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">
                                    {t('finance.approveReturn.returnParts')}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {t('finance.approveReturn.returnPartsDesc')}
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* What Will Happen Summary */}
                    <div className="bg-success-50 dark:bg-success-500/10 rounded-lg p-4 border border-success-200 dark:border-success-500/20">
                        <h3 className="text-sm font-medium text-success-700 dark:text-success-400 mb-2 flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4" />
                            {t('finance.approveReturn.whatWillHappen')}
                        </h3>
                        <ul className="text-xs text-success-600 dark:text-success-400/80 space-y-1 ml-6 list-disc">
                            <li>{t('finance.approveReturn.refundRecorded', { amount: parseFloat(partialAmount || '0').toFixed(2) })}</li>
                            <li>{t('finance.approveReturn.statusApproved')}</li>
                            <li>{t('finance.approveReturn.ticketReturned')}</li>
                            <li>{t('finance.approveReturn.journalEntry')}</li>
                            {createInventoryAdj && <li>{t('finance.approveReturn.inventoryAdjustment')}</li>}
                        </ul>
                    </div>
                </div>

                <DialogFooter className="pt-4 gap-3">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleApprove} disabled={loading || !partialAmount}>
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                {t('finance.approveReturn.processing')}
                            </span>
                        ) : (
                            t('finance.approveReturn.approveRefund')
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

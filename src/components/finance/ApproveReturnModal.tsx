'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';

interface ApproveReturnModalProps {
    returnData: {
        id: string;
        refundAmount: number;
        ticketId: string;
        reason: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export function ApproveReturnModal({ returnData, onClose, onSuccess }: ApproveReturnModalProps) {
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

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl shadow-lg w-full max-w-md">
                <div className="bg-accent px-6 py-4 rounded-t-xl">
                    <h2 className="text-lg font-semibold text-foreground">{t('finance.approveReturn.title')}</h2>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-error-container text-on-error-container rounded-lg text-body-medium flex items-start gap-2">
                            <span className="material-symbols-outlined">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">{t('finance.approveReturn.returnReason')}</div>
                        <div className="text-sm text-foreground">{returnData.reason}</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.refundAmount')} <span className="text-error">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={returnData.refundAmount}
                                    value={partialAmount}
                                    onChange={(e) => setPartialAmount(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                / ${returnData.refundAmount.toFixed(2)}
                            </div>
                        </div>
                        {parseFloat(partialAmount) < returnData.refundAmount && (
                            <div className="mt-2 text-body-small text-tertiary flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">info</span>
                                {t('finance.approveReturn.partialRefund')}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            {t('finance.notes')}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('finance.approveReturn.notesPlaceholder')}
                            rows={3}
                            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                        <input
                            type="checkbox"
                            checked={createInventoryAdj}
                            onChange={(e) => setCreateInventoryAdj(e.target.checked)}
                            id="inventory-adj"
                            className="mt-1"
                        />
                        <label htmlFor="inventory-adj" className="flex-1 cursor-pointer">
                            <div className="text-sm font-medium text-foreground">{t('finance.approveReturn.returnParts')}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {t('finance.approveReturn.returnPartsDesc')}
                            </div>
                        </label>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            {t('finance.approveReturn.whatWillHappen')}
                        </h3>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                            <li>{t('finance.approveReturn.refundRecorded', { amount: parseFloat(partialAmount || '0').toFixed(2) })}</li>
                            <li>{t('finance.approveReturn.statusApproved')}</li>
                            <li>{t('finance.approveReturn.ticketReturned')}</li>
                            <li>{t('finance.approveReturn.journalEntry')}</li>
                            {createInventoryAdj && <li>{t('finance.approveReturn.inventoryAdjustment')}</li>}
                        </ul>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 border border-input text-foreground rounded-full hover:bg-muted/50 transition-colors disabled:opacity-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={loading || !partialAmount}
                            className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-full hover:shadow-md-level2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    {t('finance.approveReturn.processing')}
                                </span>
                            ) : (
                                t('finance.approveReturn.approveRefund')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';

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
        <div className="fixed inset-0 bg-scrim/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl shadow-md-level3 w-full max-w-md">
                <div className="bg-primary-container px-6 py-4 rounded-t-xl">
                    <h2 className="text-headline-small font-bold text-on-primary-container">Approve Return & Process Refund</h2>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-4 bg-error-container text-on-error-container rounded-lg text-body-medium flex items-start gap-2">
                            <span className="material-symbols-outlined">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="bg-surface-variant/50 rounded-lg p-4">
                        <div className="text-label-small text-on-surface-variant mb-1">Return Reason</div>
                        <div className="text-body-medium text-on-surface">{returnData.reason}</div>
                    </div>

                    <div>
                        <label className="block text-label-large text-on-surface mb-2">
                            Refund Amount <span className="text-error">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={returnData.refundAmount}
                                    value={partialAmount}
                                    onChange={(e) => setPartialAmount(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="text-body-small text-on-surface-variant">
                                / ${returnData.refundAmount.toFixed(2)}
                            </div>
                        </div>
                        {parseFloat(partialAmount) < returnData.refundAmount && (
                            <div className="mt-2 text-body-small text-tertiary flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">info</span>
                                Partial refund will be processed
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-label-large text-on-surface mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this refund..."
                            rows={3}
                            className="w-full px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-secondary-container/30 rounded-lg">
                        <input
                            type="checkbox"
                            checked={createInventoryAdj}
                            onChange={(e) => setCreateInventoryAdj(e.target.checked)}
                            id="inventory-adj"
                            className="mt-1"
                        />
                        <label htmlFor="inventory-adj" className="flex-1 cursor-pointer">
                            <div className="text-body-medium text-on-surface font-medium">Return parts to inventory</div>
                            <div className="text-body-small text-on-surface-variant mt-1">
                                Creates inventory adjustment to add parts back to stock
                            </div>
                        </label>
                    </div>

                    <div className="bg-tertiary-container/30 rounded-lg p-4">
                        <h3 className="text-label-large text-on-surface font-medium mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            What will happen:
                        </h3>
                        <ul className="text-body-small text-on-surface-variant space-y-1 ml-6 list-disc">
                            <li>Refund payment of ${parseFloat(partialAmount || '0').toFixed(2)} will be recorded</li>
                            <li>Return status will be set to APPROVED</li>
                            <li>Ticket status will change to RETURNED</li>
                            <li>Journal entry will be created for audit</li>
                            {createInventoryAdj && <li>Inventory adjustment will be created</li>}
                        </ul>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 border border-outline text-on-surface rounded-full hover:bg-on-surface/8 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={loading || !partialAmount}
                            className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-full hover:shadow-md-level2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    Processing...
                                </span>
                            ) : (
                                'Approve & Refund'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

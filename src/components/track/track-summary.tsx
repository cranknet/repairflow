'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { format } from 'date-fns';
import {
    ClipboardIcon,
    CheckIcon,
    QrCodeIcon,
    PrinterIcon,
    EnvelopeIcon,
    StarIcon,
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';

interface TrackSummaryProps {
    ticketNumber: string;
    trackingCode: string;
    createdAt: string;
    completedAt?: string | null;
    warrantyDays?: number | null;
    warrantyText?: string | null;
    status: string;
    onContactSupport: () => void;
    onRateService: () => void;
    canRate: boolean;
}

export function TrackSummary({
    ticketNumber,
    trackingCode,
    createdAt,
    completedAt,
    warrantyDays,
    status,
    onContactSupport,
    onRateService,
    canRate,
}: TrackSummaryProps) {
    const { t } = useLanguage();
    const [copied, setCopied] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const getTrackingUrl = () => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}/track?ticket=${encodeURIComponent(ticketNumber)}&code=${encodeURIComponent(trackingCode)}`;
    };

    const handlePrint = () => window.print();

    return (
        <div className="space-y-4">
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ticket Number */}
                <div className="group relative p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('ticketNumber')}</p>
                        <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                                {ticketNumber}
                            </span>
                            <button
                                onClick={() => copyToClipboard(ticketNumber, 'ticket')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                aria-label={t('copyToClipboard')}
                            >
                                {copied === 'ticket' ? (
                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                ) : (
                                    <ClipboardIcon className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tracking Code */}
                <div className="group relative p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('trackingCodeLabel')}</p>
                        <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                                {trackingCode}
                            </span>
                            <button
                                onClick={() => copyToClipboard(trackingCode, 'code')}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                aria-label={t('copyToClipboard')}
                            >
                                {copied === 'code' ? (
                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                ) : (
                                    <ClipboardIcon className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Submitted Date */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 backdrop-blur-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('submissionDate')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                        {format(new Date(createdAt), 'PPp')}
                    </p>
                </div>

                {/* Warranty (if completed) */}
                {status === 'COMPLETED' && warrantyDays && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{t('warranty')}</p>
                        <p className="font-medium text-emerald-700 dark:text-emerald-300">
                            {warrantyDays} {t('days')} {t('warrantyIncluded')}
                        </p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
                <button
                    onClick={() => setShowQR(true)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium text-sm hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                    <QrCodeIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('shareTracking')}</span>
                    <span className="sm:hidden">{t('share')}</span>
                </button>

                <button
                    onClick={handlePrint}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                    <PrinterIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('printSummary')}</span>
                </button>

                <button
                    onClick={onContactSupport}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                    <EnvelopeIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('contactSupport')}</span>
                </button>

                {canRate && (status === 'COMPLETED' || status === 'REPAIRED') && (
                    <button
                        onClick={onRateService}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-medium text-sm hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
                    >
                        <StarIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('satisfaction.rating_label')}</span>
                    </button>
                )}
            </div>

            {/* QR Modal */}
            {showQR && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowQR(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-4">
                            {t('shareTracking')}
                        </h3>

                        <div className="bg-white p-4 rounded-2xl shadow-inner mx-auto w-fit">
                            <QRCodeSVG value={getTrackingUrl()} size={180} />
                        </div>

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4 font-mono">
                            {ticketNumber}
                        </p>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(getTrackingUrl());
                                setCopied('url');
                                setTimeout(() => setCopied(null), 2000);
                            }}
                            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
                        >
                            {copied === 'url' ? t('copied') : t('copyToClipboard')}
                        </button>

                        <button
                            onClick={() => setShowQR(false)}
                            className="w-full mt-2 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            {t('close')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

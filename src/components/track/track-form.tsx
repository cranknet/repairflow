'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { CogIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface TrackFormProps {
    onSubmit: (ticketNumber: string, trackingCode: string) => void;
    isLoading: boolean;
    error?: string | null;
    rateLimitError?: { retryAfter: number } | null;
    initialTicket?: string;
    initialCode?: string;
}

export function TrackForm({
    onSubmit,
    isLoading,
    error,
    rateLimitError,
    initialTicket = '',
    initialCode = '',
}: TrackFormProps) {
    const { t } = useLanguage();
    const [ticketNumber, setTicketNumber] = useState(initialTicket);
    const [trackingCode, setTrackingCode] = useState(initialCode);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(ticketNumber.trim().toUpperCase(), trackingCode.trim().toUpperCase());
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Hero Text */}
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {t('trackYourRepairStatus')}
                    </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {t('enterTicketAndCode')}
                </p>
            </div>

            {/* Form Card */}
            <div className="relative">
                {/* Background glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-xl" />

                <form
                    onSubmit={handleSubmit}
                    className="relative bg-white dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-slate-700"
                >
                    <div className="space-y-4">
                        {/* Ticket Number */}
                        <div>
                            <label
                                htmlFor="ticketNumber"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                {t('ticketNumberLabel')}
                            </label>
                            <input
                                id="ticketNumber"
                                type="text"
                                value={ticketNumber}
                                onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                                placeholder="TKT-XXXXX"
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
                            />
                        </div>

                        {/* Tracking Code */}
                        <div>
                            <label
                                htmlFor="trackingCode"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                {t('trackingCodeLabel')}
                            </label>
                            <input
                                id="trackingCode"
                                type="text"
                                value={trackingCode}
                                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                                placeholder="XXXXXXXX"
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold text-lg flex items-center justify-center gap-2 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <CogIcon className="w-5 h-5 animate-spin" />
                                    {t('tracking')}
                                </>
                            ) : (
                                <>
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                    {t('trackButton')}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error Messages */}
                    {error && (
                        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {rateLimitError && (
                        <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                            <p className="text-amber-600 dark:text-amber-400 text-sm">
                                {t('tooManyAttempts').replace('{minutes}', Math.ceil(rateLimitError.retryAfter / 60).toString())}
                            </p>
                        </div>
                    )}

                    {/* Help text */}
                    <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('lostTrackingCode')}
                    </p>
                </form>
            </div>
        </div>
    );
}

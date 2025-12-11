'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import {
    DevicePhoneMobileIcon,
    WrenchScrewdriverIcon,
    ChevronDownIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface TrackDeviceProps {
    brand: string;
    model: string;
    issue: string;
    conditionFront?: string | null;
    conditionBack?: string | null;
}

export function TrackDevice({ brand, model, issue, conditionFront, conditionBack }: TrackDeviceProps) {
    const { t, language } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const hasPhotos = conditionFront || conditionBack;

    return (
        <>
            <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 overflow-hidden backdrop-blur-sm">
                {/* Header - Always visible */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <DevicePhoneMobileIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {brand} {model}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('deviceDetails')}</p>
                        </div>
                    </div>
                    <ChevronDownIcon
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Expandable Content */}
                <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-slate-700/50 pt-4">
                        {/* Device Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('deviceBrand')}</p>
                                <p className="font-medium text-gray-900 dark:text-white">{brand}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('deviceModel')}</p>
                                <p className="font-medium text-gray-900 dark:text-white">{model}</p>
                            </div>
                        </div>

                        {/* Issue */}
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <WrenchScrewdriverIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('reportedIssues')}</p>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-200">{issue}</p>
                        </div>

                        {/* Condition Photos */}
                        {hasPhotos && (
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('conditionPhotos')}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {conditionFront && (
                                        <button
                                            onClick={() => setLightboxImage(conditionFront)}
                                            className="relative aspect-square rounded-xl overflow-hidden group"
                                        >
                                            <Image
                                                src={conditionFront}
                                                alt={t('beforeRepair')}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            <span className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded-lg bg-black/50 text-white backdrop-blur-sm z-10">
                                                {t('beforeRepair')}
                                            </span>
                                        </button>
                                    )}
                                    {conditionBack && (
                                        <button
                                            onClick={() => setLightboxImage(conditionBack)}
                                            className="relative aspect-square rounded-xl overflow-hidden group"
                                        >
                                            <Image
                                                src={conditionBack}
                                                alt={t('afterRepair')}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            <span className="absolute bottom-2 left-2 text-xs px-2 py-1 rounded-lg bg-black/50 text-white backdrop-blur-sm z-10">
                                                {t('afterRepair')}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="relative max-w-full max-h-full w-full h-full" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={lightboxImage}
                            alt={t('conditionPhotos')}
                            fill
                            className="object-contain rounded-lg"
                            unoptimized
                        />
                    </div>
                    <button
                        onClick={() => setLightboxImage(null)}
                        className={`absolute top-4 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors ${language === 'ar' ? 'left-4' : 'right-4'
                            }`}
                        aria-label={t('close')}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            )}
        </>
    );
}

'use client';

import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
import {
    ClipboardDocumentCheckIcon,
    CubeIcon,
    FaceSmileIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Login Sidebar Component
 * 
 * Right-side panel for desktop login page showing:
 * - Company logo
 * - Welcome message with tagline
 * - Three configurable feature highlights
 * 
 * Clean, light design matching the installer wizard style.
 */

interface LoginSidebarProps {
    /** Optional custom class for the container */
    className?: string;
}

const FEATURES = [
    {
        icon: ClipboardDocumentCheckIcon,
        titleKey: 'auth.login.sidebar.feature1.title',
        descKey: 'auth.login.sidebar.feature1.desc',
    },
    {
        icon: CubeIcon,
        titleKey: 'auth.login.sidebar.feature2.title',
        descKey: 'auth.login.sidebar.feature2.desc',
    },
    {
        icon: FaceSmileIcon,
        titleKey: 'auth.login.sidebar.feature3.title',
        descKey: 'auth.login.sidebar.feature3.desc',
    },
];

export function LoginSidebar({ className }: LoginSidebarProps) {
    const { t } = useLanguage();
    const { companyName, companyLogo } = useSettings();

    return (
        <div
            className={cn(
                "h-full flex flex-col justify-center p-8",
                "bg-gradient-to-br from-primary/5 via-primary/10 to-brand-100",
                "dark:from-slate-800 dark:via-slate-800 dark:to-slate-700",
                "border border-gray-100 dark:border-slate-700 border-l-0",
                "rounded-2xl",
                className
            )}
        >
            {/* Logo section */}
            <div className="flex flex-col items-center mb-8">
                {companyLogo ? (
                    <div className="relative w-16 h-16 mb-4">
                        <Image
                            src={companyLogo}
                            alt={companyName || 'RepairFlow'}
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                ) : (
                    <div className="w-16 h-16 mb-4 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-white text-2xl font-bold">R</span>
                    </div>
                )}

                <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                    {t('auth.login.sidebar.welcome')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                    {t('auth.login.sidebar.tagline')}
                </p>
            </div>

            {/* Divider */}
            <div className="w-12 h-0.5 bg-primary/20 dark:bg-slate-600 mx-auto mb-8 rounded-full" />

            {/* Feature highlights */}
            <div className="space-y-5">
                {FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <div
                            key={feature.titleKey}
                            className="flex items-start gap-3.5 group"
                        >
                            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 dark:bg-slate-700 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-slate-600 transition-colors duration-200">
                                <Icon className="w-4.5 h-4.5 text-primary dark:text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-800 dark:text-white">
                                    {t(feature.titleKey)}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                    {t(feature.descKey)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom decoration */}
            <div className="mt-auto pt-8">
                <div className="flex justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/30 dark:bg-slate-600"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

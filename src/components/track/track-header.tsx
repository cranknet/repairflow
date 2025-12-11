'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

interface TrackHeaderProps {
    logo: string;
    storeName: string;
}

export function TrackHeader({ logo, storeName }: TrackHeaderProps) {
    const { t } = useLanguage();

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-4">
                <div className="h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-9 w-9">
                            <Image
                                src={logo || '/default-logo.png'}
                                alt={storeName}
                                fill
                                className="object-contain group-hover:scale-105 transition-transform"
                                unoptimized
                            />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent hidden sm:block">
                            {storeName}
                        </span>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden md:block"
                        >
                            {t('home')}
                        </Link>
                        <LanguageSwitcher />
                    </div>
                </div>
            </div>
        </header>
    );
}

'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { QrCodeIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface SidebarTrackingCardProps {
    trackingCode: string;
}

export function SidebarTrackingCard({ trackingCode }: SidebarTrackingCardProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopyTrackingCode = async () => {
        if (!trackingCode) return;
        try {
            await navigator.clipboard.writeText(trackingCode);
            setCopied(true);
            toast({
                title: t('success'),
                description: t('trackingCodeCopied'),
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <QrCodeIcon className="h-[18px] w-[18px] text-gray-500" />
                    {t('trackingCode')}
                </h3>
            </div>
            <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm select-all">
                    {trackingCode}
                </code>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyTrackingCode}
                    className="flex-shrink-0"
                >
                    {copied ? (
                        <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                        <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    )}
                </Button>
            </div>
        </div>
    );
}

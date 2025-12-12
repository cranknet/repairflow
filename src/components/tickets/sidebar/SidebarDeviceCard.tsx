'use client';

import { useLanguage } from '@/contexts/language-context';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface SidebarDeviceCardProps {
    deviceBrand: string;
    deviceModel: string;
    deviceIssue: string;
    priority: string;
}

export function SidebarDeviceCard({ deviceBrand, deviceModel, deviceIssue, priority }: SidebarDeviceCardProps) {
    const { t } = useLanguage();

    const getPriorityColor = (priority: string) => {
        switch (priority.toUpperCase()) {
            case 'HIGH':
            case 'URGENT':
                return 'text-red-600 dark:text-red-400';
            case 'MEDIUM':
                return 'text-amber-600 dark:text-amber-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <DevicePhoneMobileIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('device')}</h3>
                    <p className="font-medium text-lg truncate">{deviceBrand} {deviceModel}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{deviceIssue}</p>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-500">{t('priority')}</span>
                <span className={`text-sm font-medium ${getPriorityColor(priority)}`}>
                    {priority}
                </span>
            </div>
        </div>
    );
}

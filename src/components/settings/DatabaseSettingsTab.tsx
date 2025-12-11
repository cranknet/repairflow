'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import {
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    ServerIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    CircleStackIcon
} from '@heroicons/react/24/outline';

interface DatabaseSettingsTabProps {
    settings: Record<string, string>;
    onSettingChange: (key: string, value: string) => void;
}

export function DatabaseSettingsTab({
    settings,
    onSettingChange,
}: DatabaseSettingsTabProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(settings.last_backup_date || null);

    const handleExportDatabase = async () => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/settings/database/export', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to export database');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `repairflow-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            const now = new Date().toISOString();
            setLastBackup(now);
            onSettingChange('last_backup_date', now);

            toast({
                title: t('success'),
                description: t('settings.database.exportSuccess') || 'Database exported successfully',
            });
        } catch (error) {
            toast({
                title: t('error'),
                description: t('settings.database.exportFailed') || 'Failed to export database',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm(t('settings.database.importConfirm') || 'This will replace all existing data. Are you sure you want to continue?')) {
            event.target.value = '';
            return;
        }

        setIsImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/settings/database/import', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to import database');
            }

            toast({
                title: t('success'),
                description: t('settings.database.importSuccess') || 'Database imported successfully. Page will refresh.',
            });

            // Refresh page to load new data
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error: any) {
            toast({
                title: t('error'),
                description: error.message || t('settings.database.importFailed') || 'Failed to import database',
            });
        } finally {
            setIsImporting(false);
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="overflow-hidden border-0 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/25">
                            <CircleStackIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{t('settings.database.title') || 'Database Management'}</CardTitle>
                            <CardDescription>
                                {t('settings.database.description') || 'Backup and restore your database'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Database Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ServerIcon className="h-5 w-5" />
                        {t('settings.database.title') || 'Database Management'}
                    </CardTitle>
                    <CardDescription>
                        {t('settings.database.description') || 'Backup and restore your database'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{t('settings.database.currentStatus') || 'Database Status'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('settings.database.connected') || 'Connected and operational'}
                                </p>
                            </div>
                            <CheckCircleIcon className="h-6 w-6 text-green-500" />
                        </div>
                        {lastBackup && (
                            <p className="text-xs text-gray-500 mt-2">
                                {t('settings.database.lastBackup') || 'Last backup'}: {new Date(lastBackup).toLocaleString()}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Backup */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        {t('settings.database.backup') || 'Backup Database'}
                    </CardTitle>
                    <CardDescription>
                        {t('settings.database.backupDescription') || 'Export all data as a JSON file'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            {t('settings.database.backupInfo') || 'The backup will include all tickets, customers, parts, users, and settings. Sensitive data like passwords will be encrypted.'}
                        </p>
                    </div>

                    <Button
                        onClick={handleExportDatabase}
                        disabled={isExporting}
                        className="w-full sm:w-auto"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        {isExporting
                            ? (t('settings.database.exporting') || 'Exporting...')
                            : (t('settings.database.exportButton') || 'Export Backup')}
                    </Button>
                </CardContent>
            </Card>

            {/* Restore */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        {t('settings.database.restore') || 'Restore Database'}
                    </CardTitle>
                    <CardDescription>
                        {t('settings.database.restoreDescription') || 'Import data from a backup file'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-start gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                    {t('settings.database.restoreWarningTitle') || 'Warning: Data Replacement'}
                                </p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                    {t('settings.database.restoreWarning') || 'Restoring from a backup will replace ALL existing data. This action cannot be undone. Make sure to backup your current data first.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportDatabase}
                            className="hidden"
                            id="database-import"
                            disabled={isImporting}
                        />
                        <label
                            htmlFor="database-import"
                            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-10 px-4 py-2 cursor-pointer dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <ArrowUpTrayIcon className="h-4 w-4" />
                            {isImporting
                                ? (t('settings.database.importing') || 'Importing...')
                                : (t('settings.database.importButton') || 'Select Backup File')}
                        </label>
                        <p className="text-sm text-gray-500">Only .json backup files are supported</p>
                    </div>
                </CardContent>
            </Card>

            {/* Scheduled Backups - Future Feature */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.database.scheduledBackups') || 'Scheduled Backups'}</CardTitle>
                    <CardDescription>
                        {t('settings.database.scheduledBackupsDescription') || 'Automatic backup scheduling'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            🚧 {t('settings.database.comingSoon') || 'Scheduled automatic backups feature coming soon.'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

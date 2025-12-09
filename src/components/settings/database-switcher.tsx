'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';

interface DatabaseConfig {
    type: 'sqlite' | 'mysql';
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
}

export function DatabaseSwitcher() {
    const { t } = useLanguage();
    const [config, setConfig] = useState<DatabaseConfig>({
        type: 'sqlite',
    });
    const [testStatus, setTestStatus] = useState<{
        status: 'idle' | 'testing' | 'success' | 'error';
        message?: string;
    }>({ status: 'idle' });
    const [isSaving, setIsSaving] = useState(false);

    // Database switcher is no longer available (Electron removed)
    const isElectron = false;

    useEffect(() => {
        // Load current database configuration
        const loadConfig = async () => {
            try {
                const response = await fetch('/api/settings/database');
                if (response.ok) {
                    const data = await response.json();
                    setConfig(data);
                }
            } catch (error) {
                console.error('Failed to load database config:', error);
            }
        };
        loadConfig();
    }, []);

    const handleTestConnection = async () => {
        setTestStatus({ status: 'testing' });
        try {
            const response = await fetch('/api/settings/database/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            const result = await response.json();

            if (response.ok) {
                setTestStatus({ status: 'success', message: t('database.connectionSuccessful') });
            } else {
                setTestStatus({ status: 'error', message: result.error || t('errors.connectionFailed') });
            }
        } catch (error) {
            setTestStatus({ status: 'error', message: t('errors.connectionFailed') });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/settings/database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                alert(t('database.configSaved'));
            } else {
                const result = await response.json();
                alert(t('errors.failedToSaveConfig') + ': ' + (result.error || ''));
            }
        } catch (error) {
            alert(t('errors.failedToSaveConfig'));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isElectron) {
        return (
            <Card className="p-6">
                <div className="text-center text-gray-500">
                    <p className="text-sm">{t('database.switcherNotAvailable')}</p>
                    <p className="text-xs mt-2">{t('database.configureEnvFile')}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">{t('database.configuration')}</h3>
                <p className="text-sm text-gray-600 mb-4">
                    {t('database.switchDescription')}
                </p>
            </div>

            {/* Database Type Selection */}
            <div>
                <label className="block text-sm font-medium mb-2">{t('database.type')}</label>
                <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            value="sqlite"
                            checked={config.type === 'sqlite'}
                            onChange={(e) => setConfig({ ...config, type: e.target.value as 'sqlite' })}
                            className="mr-2"
                        />
                        <span>{t('database.sqliteLocal')}</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            value="mysql"
                            checked={config.type === 'mysql'}
                            onChange={(e) => setConfig({ ...config, type: e.target.value as 'mysql' })}
                            className="mr-2"
                        />
                        <span>{t('database.mysqlRemote')}</span>
                    </label>
                </div>
            </div>

            {/* MySQL Configuration Fields */}
            {config.type === 'mysql' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('database.host')}</label>
                            <input
                                type="text"
                                value={config.host || ''}
                                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                                placeholder="localhost"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('database.port')}</label>
                            <input
                                type="number"
                                value={config.port || 3306}
                                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                                placeholder="3306"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('database.databaseName')}</label>
                        <input
                            type="text"
                            value={config.database || ''}
                            onChange={(e) => setConfig({ ...config, database: e.target.value })}
                            placeholder="repairflow"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('database.username')}</label>
                            <input
                                type="text"
                                value={config.user || ''}
                                onChange={(e) => setConfig({ ...config, user: e.target.value })}
                                placeholder="root"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('database.password')}</label>
                            <input
                                type="password"
                                value={config.password || ''}
                                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                placeholder="********"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                    </div>

                    {/* Test Connection Button */}
                    <div>
                        <button
                            onClick={handleTestConnection}
                            disabled={testStatus.status === 'testing'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {testStatus.status === 'testing' ? t('database.testing') : t('database.testConnection')}
                        </button>

                        {testStatus.status !== 'idle' && testStatus.status !== 'testing' && (
                            <div className={`mt-2 text-sm ${testStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {testStatus.message}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SQLite Info */}
            {config.type === 'sqlite' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">{t('database.localDatabase')}</h4>
                    <p className="text-sm text-gray-600">
                        {t('database.localDatabaseDescription')}
                    </p>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
                <button
                    onClick={handleSave}
                    disabled={isSaving || (config.type === 'mysql' && testStatus.status !== 'success')}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? t('database.saving') : t('database.saveConfiguration')}
                </button>
            </div>

            {config.type === 'mysql' && testStatus.status !== 'success' && (
                <p className="text-xs text-gray-500 text-right">
                    {t('database.testBeforeSaving')}
                </p>
            )}
        </Card>
    );
}

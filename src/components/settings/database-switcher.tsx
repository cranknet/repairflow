'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface DatabaseConfig {
    type: 'sqlite' | 'mysql';
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
}

export function DatabaseSwitcher() {
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
                setTestStatus({ status: 'success', message: 'Connection successful!' });
            } else {
                setTestStatus({ status: 'error', message: result.error || 'Connection failed' });
            }
        } catch (error) {
            setTestStatus({ status: 'error', message: 'Failed to test connection' });
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
                alert('Database configuration saved! Please restart the application for changes to take effect.');
            } else {
                const result = await response.json();
                alert('Failed to save configuration: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isElectron) {
        return (
            <Card className="p-6">
                <div className="text-center text-gray-500">
                    <p className="text-sm">Database switcher is only available in the desktop application.</p>
                    <p className="text-xs mt-2">Configure database connection in your .env file for web deployment.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Database Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Switch between local SQLite database or remote MySQL database.
                </p>
            </div>

            {/* Database Type Selection */}
            <div>
                <label className="block text-sm font-medium mb-2">Database Type</label>
                <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            value="sqlite"
                            checked={config.type === 'sqlite'}
                            onChange={(e) => setConfig({ ...config, type: e.target.value as 'sqlite' })}
                            className="mr-2"
                        />
                        <span>SQLite (Local)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            value="mysql"
                            checked={config.type === 'mysql'}
                            onChange={(e) => setConfig({ ...config, type: e.target.value as 'mysql' })}
                            className="mr-2"
                        />
                        <span>MySQL (Remote)</span>
                    </label>
                </div>
            </div>

            {/* MySQL Configuration Fields */}
            {config.type === 'mysql' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Host</label>
                            <input
                                type="text"
                                value={config.host || ''}
                                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                                placeholder="localhost"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Port</label>
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
                        <label className="block text-sm font-medium mb-1">Database Name</label>
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
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input
                                type="text"
                                value={config.user || ''}
                                onChange={(e) => setConfig({ ...config, user: e.target.value })}
                                placeholder="root"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
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
                            {testStatus.status === 'testing' ? 'Testing...' : 'Test Connection'}
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
                    <h4 className="font-medium text-sm mb-2">Local Database</h4>
                    <p className="text-sm text-gray-600">
                        Using local SQLite database stored in your application data folder.
                        Each installation will have its own database.
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
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            {config.type === 'mysql' && testStatus.status !== 'success' && (
                <p className="text-xs text-gray-500 text-right">
                    Please test the connection before saving
                </p>
            )}
        </Card>
    );
}

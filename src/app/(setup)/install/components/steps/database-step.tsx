'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';
import { CircleStackIcon } from '@heroicons/react/24/solid';
import type { InstallState, DbCheckResult } from '../../lib/validation';

interface DatabaseStepProps {
    onNext: () => void;
    onBack: () => void;
    installState: InstallState;
    updateState: (updates: Partial<InstallState>) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

type DbProvider = 'postgresql' | 'mysql';

interface ConnectionForm {
    provider: DbProvider;
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
}

interface ConfigStep {
    name: string;
    success: boolean;
    error?: string;
}

export function DatabaseStep({ onNext, onBack, installState, updateState, isLoading, setIsLoading }: DatabaseStepProps) {
    const { t } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [initSteps, setInitSteps] = useState<ConfigStep[]>([]);
    const [isConfigured, setIsConfigured] = useState(false);

    const [form, setForm] = useState<ConnectionForm>({
        provider: 'postgresql',
        host: 'localhost',
        port: '5432',
        database: 'repairflow',
        username: '',
        password: '',
    });

    const updateForm = (field: keyof ConnectionForm, value: string) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            // Update port when provider changes
            if (field === 'provider') {
                updated.port = value === 'mysql' ? '3306' : '5432';
            }
            return updated;
        });
        // Clear test result when form changes
        setTestResult(null);
        setIsConfigured(false);
    };

    const testConnection = async () => {
        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await fetch('/api/install/database/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    port: parseInt(form.port, 10),
                    testOnly: true,
                }),
            });

            const data = await response.json();
            setTestResult({
                success: data.success,
                message: data.message || (data.success ? 'Connection successful' : 'Connection failed'),
            });
        } catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Connection test failed',
            });
        } finally {
            setIsTesting(false);
        }
    };

    const initializeDatabase = async () => {
        setIsInitializing(true);
        setInitSteps([]);

        try {
            const response = await fetch('/api/install/database/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    port: parseInt(form.port, 10),
                }),
            });

            const data = await response.json();

            if (data.steps) {
                setInitSteps(data.steps);
            }

            if (data.success) {
                setIsConfigured(true);
                updateState({
                    databaseConfigured: true,
                    databaseProvider: form.provider,
                });
            } else {
                setTestResult({
                    success: false,
                    message: data.error || 'Database initialization failed',
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : 'Database initialization failed',
            });
        } finally {
            setIsInitializing(false);
        }
    };

    const canTest = form.host && form.database && form.username;
    const canInitialize = testResult?.success && !isConfigured;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CircleStackIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('install.database.title') || 'Database Configuration'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('install.database.configureDescription') || 'Configure your database connection'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
                {/* Provider Selection */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">
                        {t('install.database.selectProvider') || 'Database Engine'}
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => updateForm('provider', 'postgresql')}
                            className={`p-4 rounded-xl border-2 transition-all ${form.provider === 'postgresql'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <span className="text-2xl">🐘</span>
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">PostgreSQL</span>
                                <span className="text-xs text-gray-500">{t('install.database.recommended') || 'Recommended'}</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => updateForm('provider', 'mysql')}
                            className={`p-4 rounded-xl border-2 transition-all ${form.provider === 'mysql'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <span className="text-2xl">🐬</span>
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">MySQL</span>
                                <span className="text-xs text-gray-500">{t('install.database.compatible') || 'MariaDB compatible'}</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Connection Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="host">{t('install.database.host') || 'Host'}</Label>
                        <Input
                            id="host"
                            value={form.host}
                            onChange={(e) => updateForm('host', e.target.value)}
                            placeholder="localhost or db.example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="port">{t('install.database.port') || 'Port'}</Label>
                        <Input
                            id="port"
                            value={form.port}
                            onChange={(e) => updateForm('port', e.target.value)}
                            placeholder={form.provider === 'mysql' ? '3306' : '5432'}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="database">{t('install.database.databaseName') || 'Database Name'}</Label>
                        <Input
                            id="database"
                            value={form.database}
                            onChange={(e) => updateForm('database', e.target.value)}
                            placeholder="repairflow"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">{t('install.database.username') || 'Username'}</Label>
                        <Input
                            id="username"
                            value={form.username}
                            onChange={(e) => updateForm('username', e.target.value)}
                            placeholder="postgres or root"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="password">{t('install.database.password') || 'Password'}</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) => updateForm('password', e.target.value)}
                                placeholder="••••••••"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Test Connection Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={testConnection}
                        disabled={!canTest || isTesting || isInitializing}
                        className="gap-2"
                    >
                        {isTesting ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <CircleStackIcon className="h-4 w-4" />
                        )}
                        {t('install.database.testConnection') || 'Test Connection'}
                    </Button>

                    {canInitialize && (
                        <Button
                            type="button"
                            onClick={initializeDatabase}
                            disabled={isInitializing}
                            className="gap-2"
                        >
                            {isInitializing ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircleIcon className="h-4 w-4" />
                            )}
                            {t('install.database.initializeDatabase') || 'Initialize Database'}
                        </Button>
                    )}
                </div>

                {/* Test Result */}
                {testResult && (
                    <div className={`p-4 rounded-lg ${testResult.success
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                        <div className="flex items-start gap-3">
                            {testResult.success ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                                <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <p className={`text-sm ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                                }`}>
                                {testResult.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Initialization Steps */}
                {initSteps.length > 0 && (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            {t('install.database.initializationProgress') || 'Initialization Progress'}
                        </Label>
                        <div className="space-y-2">
                            {initSteps.map((step, index) => (
                                <div key={index} className="flex items-center gap-3 text-sm">
                                    {step.success ? (
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <XCircleIcon className="h-5 w-5 text-red-500" />
                                    )}
                                    <span className={step.success ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400'}>
                                        {step.name}
                                        {step.error && `: ${step.error}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Success State */}
                {isConfigured && (
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-green-700 dark:text-green-300">
                                    {t('install.database.configurationComplete') || 'Database configured successfully!'}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    {form.provider === 'postgresql' ? 'PostgreSQL' : 'MySQL'} @ {form.host}:{form.port}/{form.database}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-slate-700">
                    <Button variant="outline" onClick={onBack} className="gap-2">
                        <ArrowLeftIcon className="h-4 w-4" />
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={!isConfigured}
                        className="gap-2 min-w-[120px]"
                    >
                        {t('install.nav.next') || 'Next'}
                        <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

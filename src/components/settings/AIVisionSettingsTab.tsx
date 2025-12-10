'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    EyeSlashIcon,
    SparklesIcon,
    ArrowPathIcon,
    QuestionMarkCircleIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

type AIProvider = 'google' | 'openai' | 'anthropic';

interface AIVisionSettings {
    aiVisionProvider: AIProvider;
    hasAiApiKey: boolean;
}

interface TestResult {
    success: boolean;
    error?: string;
    latency?: number;
}

interface ProviderInfo {
    id: AIProvider;
    name: string;
    icon: string;
    gradient: string;
    freeQuota: string;
    docsUrl: string;
    keyUrl: string;
    placeholder: string;
}

const PROVIDERS: ProviderInfo[] = [
    {
        id: 'google',
        name: 'Google Gemini',
        icon: 'G',
        gradient: 'from-blue-500 via-green-500 to-yellow-500',
        freeQuota: '1,500 requests/day',
        docsUrl: 'https://ai.google.dev',
        keyUrl: 'https://aistudio.google.com/app/apikey',
        placeholder: 'AIza...',
    },
    {
        id: 'openai',
        name: 'OpenAI GPT-4',
        icon: '◐',
        gradient: 'from-green-400 to-emerald-600',
        freeQuota: 'Pay-as-you-go',
        docsUrl: 'https://platform.openai.com',
        keyUrl: 'https://platform.openai.com/api-keys',
        placeholder: 'sk-...',
    },
    {
        id: 'anthropic',
        name: 'Claude AI',
        icon: '◎',
        gradient: 'from-orange-400 to-amber-600',
        freeQuota: 'Pay-as-you-go',
        docsUrl: 'https://console.anthropic.com',
        keyUrl: 'https://console.anthropic.com/settings/keys',
        placeholder: 'sk-ant-...',
    },
];

export function AIVisionSettingsTab() {
    const { t } = useLanguage();
    const { toast } = useToast();

    const [settings, setSettings] = useState<AIVisionSettings>({
        aiVisionProvider: 'google',
        hasAiApiKey: false,
    });
    const [newApiKey, setNewApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const selectedProvider = PROVIDERS.find(p => p.id === settings.aiVisionProvider) || PROVIDERS[0];

    // Load settings
    const loadSettings = useCallback(async () => {
        setLoadError(null);
        try {
            const res = await fetch('/api/settings/ai-vision');
            if (!res.ok) {
                throw new Error(`${t('settings.aiVision.loadError') || 'Failed to load settings'}: ${res.status}`);
            }
            const data = await res.json();
            setSettings({
                aiVisionProvider: data.aiVisionProvider || 'google',
                hasAiApiKey: data.hasAiApiKey === 'true',
            });
        } catch (error) {
            console.error('Failed to load AI Vision settings:', error);
            setLoadError(error instanceof Error ? error.message : t('settings.aiVision.loadError') || 'Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Clear test result when provider changes
    useEffect(() => {
        setTestResult(null);
        setNewApiKey('');
    }, [settings.aiVisionProvider]);

    const handleTestKey = async () => {
        if (!newApiKey.trim() && !settings.hasAiApiKey) {
            toast({
                title: t('settings.aiVision.noKeyError') || 'No API Key',
                description: t('settings.aiVision.noKeyErrorDesc') || 'Please enter an API key to test',
                variant: 'destructive',
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const res = await fetch('/api/settings/ai-vision/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: settings.aiVisionProvider,
                    apiKey: newApiKey.trim() || undefined,
                    type: 'ai',
                }),
            });

            const result = await res.json();
            setTestResult(result);

            toast({
                title: result.success
                    ? (t('settings.aiVision.testSuccess') || '✓ Connection Successful')
                    : (t('settings.aiVision.testFailed') || '✗ Connection Failed'),
                description: result.success
                    ? `${t('settings.aiVision.responseTime') || 'Response time'}: ${result.latency}ms`
                    : result.error,
                variant: result.success ? 'default' : 'destructive',
            });
        } catch (error) {
            const errorMessage = t('settings.aiVision.networkError') || 'Network error - check your connection';
            setTestResult({ success: false, error: errorMessage });
            toast({
                title: t('settings.aiVision.testFailed') || '✗ Connection Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updateData: Record<string, string> = {
                scanMode: 'vision', // Always use vision mode
                aiVisionProvider: settings.aiVisionProvider,
            };
            if (newApiKey.trim()) {
                updateData.aiVisionApiKey = newApiKey.trim();
            }

            const res = await fetch('/api/settings/ai-vision', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `${t('settings.aiVision.saveError') || 'Failed to save'}: ${res.status}`);
            }

            toast({
                title: t('settings.aiVision.saved') || '✓ Settings Saved',
                description: t('settings.aiVision.savedDesc') || 'AI Vision settings updated successfully',
            });

            setNewApiKey('');
            await loadSettings();
        } catch (error) {
            toast({
                title: t('settings.aiVision.saveError') || 'Save Failed',
                description: error instanceof Error ? error.message : t('settings.aiVision.saveErrorDesc') || 'Could not save settings',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const canTest = newApiKey.trim() || settings.hasAiApiKey;
    const hasChanges = newApiKey.trim() !== '';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <SparklesIcon className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                    {t('settings.aiVision.loading') || 'Loading AI settings...'}
                </p>
            </div>
        );
    }

    if (loadError) {
        return (
            <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                    <ExclamationTriangleIcon className="w-12 h-12 text-destructive" />
                    <div className="text-center">
                        <p className="font-medium text-destructive">{t('settings.aiVision.loadError') || 'Failed to Load Settings'}</p>
                        <p className="text-sm text-muted-foreground mt-1">{loadError}</p>
                    </div>
                    <Button variant="outline" onClick={() => { setIsLoading(true); loadSettings(); }}>
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        {t('settings.aiVision.retry') || 'Retry'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="overflow-hidden border-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{t('settings.aiVision.title') || 'AI Vision Settings'}</CardTitle>
                            <CardDescription>
                                {t('settings.aiVision.description') || 'Configure AI-powered receipt scanning and part extraction'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Provider Selection */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        {t('settings.aiVision.selectProvider') || 'Select AI Provider'}
                    </CardTitle>
                    <CardDescription className="text-sm">
                        {t('settings.aiVision.selectProviderDesc') || 'Choose which AI service to use for analyzing receipt images'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3">
                        {PROVIDERS.map((provider) => {
                            const isSelected = settings.aiVisionProvider === provider.id;
                            return (
                                <button
                                    key={provider.id}
                                    onClick={() => setSettings(prev => ({ ...prev, aiVisionProvider: provider.id }))}
                                    className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
                                        ${isSelected
                                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                        }`}
                                >
                                    {/* Provider Icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${provider.gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-105`}>
                                        {provider.icon}
                                    </div>

                                    {/* Provider Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{provider.name}</span>
                                            {isSelected && settings.hasAiApiKey && (
                                                <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {t('settings.aiVision.freeQuota') || 'Free quota'}: {provider.freeQuota}
                                        </p>
                                    </div>

                                    {/* Selection Indicator */}
                                    <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center
                                        ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                                        {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* API Key Configuration */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedProvider.gradient} flex items-center justify-center text-white font-bold shadow-md`}>
                                {selectedProvider.icon}
                            </div>
                            <div>
                                <CardTitle className="text-base font-medium">
                                    {selectedProvider.name} {t('settings.aiVision.apiKey') || 'API Key'}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {t('settings.aiVision.apiKeyDesc') || 'Enter your API key to enable AI-powered features'}
                                </CardDescription>
                            </div>
                        </div>
                        {settings.hasAiApiKey ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                {t('settings.aiVision.connected') || 'Connected'}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">
                                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                {t('settings.aiVision.required') || 'Required'}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* API Key Input */}
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                type={showApiKey ? 'text' : 'password'}
                                value={newApiKey}
                                onChange={(e) => {
                                    setNewApiKey(e.target.value);
                                    setTestResult(null);
                                }}
                                placeholder={settings.hasAiApiKey
                                    ? (t('settings.aiVision.enterNewKey') || 'Enter new key to replace current...')
                                    : `${t('settings.aiVision.pasteKey') || 'Paste your API key'} (${selectedProvider.placeholder})`
                                }
                                className="font-mono text-sm pr-20"
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="p-2 hover:bg-muted rounded-md transition-colors"
                                    title={showApiKey ? (t('settings.aiVision.hideKey') || 'Hide') : (t('settings.aiVision.showKey') || 'Show')}
                                >
                                    {showApiKey ? (
                                        <EyeSlashIcon className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <EyeIcon className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Test Result */}
                        {testResult && (
                            <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg transition-all ${testResult.success
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                }`}>
                                {testResult.success ? (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5 shrink-0" />
                                        <span>{t('settings.aiVision.connectionSuccess') || 'Connection successful'} ({testResult.latency}ms)</span>
                                    </>
                                ) : (
                                    <>
                                        <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                                        <span>{testResult.error}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleTestKey}
                            disabled={!canTest || isTesting}
                            className="gap-2"
                        >
                            {isTesting ? (
                                <div className="flex items-center gap-2">
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    <span>{t('settings.aiVision.testing') || 'Testing...'}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>{t('settings.aiVision.testConnection') || 'Test Connection'}</span>
                                </div>
                            )}
                        </Button>

                        <button
                            onClick={() => setShowGuideModal(true)}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            <QuestionMarkCircleIcon className="w-4 h-4" />
                            {t('settings.aiVision.howToGetKey') || 'How to get an API key?'}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <Button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    size="lg"
                    className="min-w-[140px] gap-2"
                >
                    {isSaving ? (
                        <div className="flex items-center gap-2">
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            <span>{t('settings.aiVision.saving') || 'Saving...'}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>{t('settings.aiVision.saveSettings') || 'Save Settings'}</span>
                        </div>
                    )}
                </Button>
            </div>

            {/* Setup Guide Modal */}
            <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedProvider.gradient} flex items-center justify-center text-white font-bold shadow-md`}>
                                {selectedProvider.icon}
                            </div>
                            {t('settings.aiVision.setupGuide') || 'Setup Guide'}: {selectedProvider.name}
                        </DialogTitle>
                        <DialogDescription>
                            {t('settings.aiVision.setupGuideDesc') || 'Follow these steps to obtain an API key for AI-powered receipt scanning'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        {/* Steps */}
                        <div className="space-y-4">
                            {[
                                {
                                    step: 1,
                                    title: t('settings.aiVision.guide.step1Title') || 'Open the Console',
                                    desc: t('settings.aiVision.guide.step1Desc') || 'Go to the provider\'s developer console',
                                    action: (
                                        <a
                                            href={selectedProvider.keyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline flex items-center gap-1"
                                        >
                                            {selectedProvider.keyUrl.replace('https://', '')}
                                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                        </a>
                                    ),
                                },
                                {
                                    step: 2,
                                    title: t('settings.aiVision.guide.step2Title') || 'Sign In',
                                    desc: selectedProvider.id === 'google'
                                        ? (t('settings.aiVision.guide.step2DescGoogle') || 'Sign in with your Google account (free, no credit card)')
                                        : (t('settings.aiVision.guide.step2DescOther') || 'Create an account or sign in'),
                                },
                                {
                                    step: 3,
                                    title: t('settings.aiVision.guide.step3Title') || 'Create API Key',
                                    desc: t('settings.aiVision.guide.step3Desc') || 'Click "Create API Key" or similar button',
                                },
                                {
                                    step: 4,
                                    title: t('settings.aiVision.guide.step4Title') || 'Copy & Paste',
                                    desc: t('settings.aiVision.guide.step4Desc') || 'Copy the key and paste it in the field above',
                                },
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                                        {item.step}
                                    </div>
                                    <div className="pt-0.5">
                                        <p className="font-medium">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        {item.action}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Info Box */}
                        {selectedProvider.id === 'google' && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl">
                                <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5 shrink-0" />
                                    <span>
                                        <strong>{t('settings.aiVision.freeTier') || 'Free tier'}:</strong> {selectedProvider.freeQuota}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowGuideModal(false)}>
                            {t('settings.aiVision.gotIt') || 'Got it'}
                        </Button>
                        <a
                            href={selectedProvider.keyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            <span>{t('settings.aiVision.openConsole') || 'Open Console'}</span>
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </a>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

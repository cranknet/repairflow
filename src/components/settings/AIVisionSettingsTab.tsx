'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';

type ScanMode = 'tesseract' | 'ocrspace' | 'vision';

interface AIVisionSettings {
    scanMode: ScanMode;
    aiVisionApiKey: string;
    ocrApiKey: string;
    hasAiApiKey: string;
    hasOcrApiKey: string;
}

interface TestResult {
    success: boolean;
    error?: string;
    latency?: number;
}

export function AIVisionSettingsTab() {
    const { t } = useLanguage();
    const { toast } = useToast();

    const [settings, setSettings] = useState<AIVisionSettings>({
        scanMode: 'tesseract',
        aiVisionApiKey: '',
        ocrApiKey: '',
        hasAiApiKey: 'false',
        hasOcrApiKey: 'false',
    });
    const [newAiApiKey, setNewAiApiKey] = useState('');
    const [newOcrApiKey, setNewOcrApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState<'ai' | 'ocr' | null>(null);
    const [testResult, setTestResult] = useState<{ type: 'ai' | 'ocr'; result: TestResult } | null>(null);
    const [showGuideModal, setShowGuideModal] = useState(false);

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch('/api/settings/ai-vision');
                if (res.ok) {
                    const data = await res.json();
                    setSettings({
                        scanMode: data.scanMode || 'tesseract',
                        aiVisionApiKey: data.aiVisionApiKey || '',
                        ocrApiKey: data.ocrApiKey || '',
                        hasAiApiKey: data.hasAiApiKey || 'false',
                        hasOcrApiKey: data.hasOcrApiKey || 'false',
                    });
                    // Don't auto-show guide anymore, user clicks "Need help?"
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        setTestResult(null);
    }, [settings.scanMode, newAiApiKey, newOcrApiKey]);

    const handleTestAiKey = async () => {
        setIsTesting('ai');
        setTestResult(null);
        try {
            const res = await fetch('/api/settings/ai-vision/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'google', apiKey: newAiApiKey.trim() || undefined, type: 'ai' }),
            });
            const result = await res.json();
            setTestResult({ type: 'ai', result });
            toast({
                title: result.success ? '✅ Valid!' : '❌ Error',
                description: result.success ? `Response: ${result.latency}ms` : result.error,
                variant: result.success ? 'default' : 'destructive',
            });
        } catch {
            setTestResult({ type: 'ai', result: { success: false, error: 'Network error' } });
        } finally {
            setIsTesting(null);
        }
    };

    const handleTestOcrKey = async () => {
        setIsTesting('ocr');
        setTestResult(null);
        try {
            const res = await fetch('/api/settings/ai-vision/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ocrApiKey: newOcrApiKey.trim() || undefined, type: 'ocr' }),
            });
            const result = await res.json();
            setTestResult({ type: 'ocr', result });
        } catch {
            setTestResult({ type: 'ocr', result: { success: false, error: 'Network error' } });
        } finally {
            setIsTesting(null);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updateData: Record<string, string> = { scanMode: settings.scanMode, aiVisionProvider: 'google' };
            if (newAiApiKey.trim()) updateData.aiVisionApiKey = newAiApiKey.trim();
            if (newOcrApiKey.trim()) updateData.ocrApiKey = newOcrApiKey.trim();

            const res = await fetch('/api/settings/ai-vision', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });
            if (!res.ok) throw new Error();

            toast({ title: '✅ Saved!' });
            setNewAiApiKey('');
            setNewOcrApiKey('');

            const reloadRes = await fetch('/api/settings/ai-vision');
            if (reloadRes.ok) {
                const data = await reloadRes.json();
                setSettings({
                    scanMode: data.scanMode || 'tesseract',
                    aiVisionApiKey: data.aiVisionApiKey || '',
                    ocrApiKey: data.ocrApiKey || '',
                    hasAiApiKey: data.hasAiApiKey || 'false',
                    hasOcrApiKey: data.hasOcrApiKey || 'false',
                });
            }
        } catch {
            toast({ title: '❌ Error', description: 'Failed to save', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const canTestAi = newAiApiKey.trim() || settings.hasAiApiKey === 'true';
    const canTestOcr = newOcrApiKey.trim() || settings.hasOcrApiKey === 'true';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* OCR Mode - Always visible at top */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Scan Mode</CardTitle>
                    <CardDescription className="text-xs">Choose how to extract text from receipt images</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'tesseract', label: 'Tesseract', badge: 'FREE', desc: 'Browser OCR' },
                            { id: 'ocrspace', label: 'OCR.space', badge: '500/day', desc: 'Cloud OCR' },
                            { id: 'vision', label: 'AI Vision', badge: 'Best', desc: 'Direct AI' },
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSettings(prev => ({ ...prev, scanMode: mode.id as ScanMode }))}
                                className={`p-3 rounded-lg border text-left transition-all ${settings.scanMode === mode.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">{mode.label}</span>
                                    {settings.scanMode === mode.id && <span className="text-blue-500 text-xs">✓</span>}
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${mode.id === 'tesseract' ? 'bg-green-100 text-green-700' :
                                    mode.id === 'ocrspace' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                    }`}>{mode.badge}</span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* OCR.space API Key - Only when ocrspace mode */}
            {settings.scanMode === 'ocrspace' && (
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">☁️</span>
                                <div>
                                    <CardTitle className="text-sm font-medium">OCR.space API Key</CardTitle>
                                    <CardDescription className="text-xs">
                                        <a href="https://ocr.space/ocrapi/freekey" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Get free key (500/day) →</a>
                                    </CardDescription>
                                </div>
                            </div>
                            {settings.hasOcrApiKey === 'true' && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓</span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                value={newOcrApiKey}
                                onChange={(e) => setNewOcrApiKey(e.target.value)}
                                placeholder="OCR.space API key..."
                                className="font-mono text-sm"
                            />
                            <Button variant="outline" onClick={handleTestOcrKey} disabled={!canTestOcr || isTesting === 'ocr'} className="shrink-0">
                                {isTesting === 'ocr' ? '...' : 'Test'}
                            </Button>
                        </div>
                        {testResult?.type === 'ocr' && (
                            <div className={`text-xs px-3 py-2 rounded mt-2 ${testResult.result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {testResult.result.success ? '✅ Valid' : `❌ ${testResult.result.error}`}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Google Gemini API Key - Only when tesseract or vision mode */}
            {(settings.scanMode === 'tesseract' || settings.scanMode === 'vision') && (
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">G</div>
                                <div>
                                    <CardTitle className="text-sm font-medium">Google Gemini API</CardTitle>
                                    <CardDescription className="text-xs">Free: 1,500 requests/day</CardDescription>
                                </div>
                            </div>
                            {settings.hasAiApiKey === 'true' ? (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">✓ Connected</span>
                            ) : (
                                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">Required</span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                value={newAiApiKey}
                                onChange={(e) => setNewAiApiKey(e.target.value)}
                                placeholder={settings.hasAiApiKey === 'true' ? 'Enter new key to replace...' : 'Paste your API key here...'}
                                className="font-mono text-sm"
                            />
                            <Button variant="outline" onClick={handleTestAiKey} disabled={!canTestAi || isTesting === 'ai'} className="shrink-0">
                                {isTesting === 'ai' ? '...' : 'Test'}
                            </Button>
                        </div>
                        {testResult?.type === 'ai' && (
                            <div className={`text-xs px-3 py-2 rounded ${testResult.result.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                                {testResult.result.success ? `✅ Connected (${testResult.result.latency}ms)` : `❌ ${testResult.result.error}`}
                            </div>
                        )}
                        {settings.hasAiApiKey !== 'true' && (
                            <button onClick={() => setShowGuideModal(true)} className="text-xs text-blue-600 hover:underline">
                                How to get a free API key?
                            </button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* OCR.space needs AI key too - info note */}
            {settings.scanMode === 'ocrspace' && (
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">G</div>
                                <div>
                                    <CardTitle className="text-sm font-medium">Google Gemini API (for text parsing)</CardTitle>
                                    <CardDescription className="text-xs">Required to parse OCR text into parts</CardDescription>
                                </div>
                            </div>
                            {settings.hasAiApiKey === 'true' ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓</span>
                            ) : (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Required</span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                value={newAiApiKey}
                                onChange={(e) => setNewAiApiKey(e.target.value)}
                                placeholder={settings.hasAiApiKey === 'true' ? 'Enter new key to replace...' : 'Paste your API key here...'}
                                className="font-mono text-sm"
                            />
                            <Button variant="outline" onClick={handleTestAiKey} disabled={!canTestAi || isTesting === 'ai'} className="shrink-0">
                                {isTesting === 'ai' ? '...' : 'Test'}
                            </Button>
                        </div>
                        {settings.hasAiApiKey !== 'true' && (
                            <button onClick={() => setShowGuideModal(true)} className="text-xs text-blue-600 hover:underline">
                                How to get a free API key?
                            </button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Save */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>

            {/* Guide Modal */}
            <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">🔑</span>
                            Get Your Free Google AI Key
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex gap-3 items-start">
                            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</div>
                            <div>
                                <p className="font-medium">Open Google AI Studio</p>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    aistudio.google.com/apikey →
                                </a>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</div>
                            <div>
                                <p className="font-medium">Sign in with Google</p>
                                <p className="text-sm text-gray-500">Free, no credit card needed</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</div>
                            <div>
                                <p className="font-medium">Create API Key</p>
                                <p className="text-sm text-gray-500">Click "Create API key in new project"</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">4</div>
                            <div>
                                <p className="font-medium">Copy & Paste</p>
                                <p className="text-sm text-gray-500">Paste your key in the field above</p>
                            </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
                            <p className="text-green-700 dark:text-green-400">
                                <strong>🎉 Free tier:</strong> 1,500 requests/day
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setShowGuideModal(false)}>
                            Got it
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

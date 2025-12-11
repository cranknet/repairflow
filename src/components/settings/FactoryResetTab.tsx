'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function FactoryResetTab() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetConfirmation, setResetConfirmation] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const handleFactoryReset = async () => {
        if (resetConfirmation !== 'RESET') {
            toast({ title: t('error'), description: t('typeResetToConfirm') });
            return;
        }
        setIsResetting(true);
        try {
            const response = await fetch('/api/settings/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmation: resetConfirmation }),
            });
            if (!response.ok) throw new Error('Failed to reset system');
            toast({ title: t('success'), description: t('resetSuccessful') });
            setTimeout(() => { window.location.href = '/install'; }, 1500);
        } catch (error: any) {
            toast({ title: t('error'), description: error.message || t('resetFailed') });
            setIsResetting(false);
        } finally {
            setShowResetConfirm(false);
            setResetConfirmation('');
        }
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header Card */}
                <Card className="overflow-hidden border-0 bg-gradient-to-r from-red-500/10 via-rose-500/10 to-pink-500/10">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25">
                                <ExclamationTriangleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-red-600 dark:text-red-400">{t('settings.factoryReset.title') || 'Factory Reset'}</CardTitle>
                                <CardDescription>
                                    {t('settings.factoryReset.description') || 'Reset all system settings and data to their initial state'}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-red-200 dark:border-red-800">
                    <CardContent className="pt-6 space-y-6">
                        {/* Warning Section */}
                        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                                {t('settings.factoryReset.warningTitle') || 'Warning: This action cannot be undone'}
                            </h3>
                            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                                <li>{t('settings.factoryReset.warning1') || 'All settings will be reset to default values'}</li>
                                <li>{t('settings.factoryReset.warning2') || 'All users except the default admin will be deleted'}</li>
                                <li>{t('settings.factoryReset.warning3') || 'All tickets, customers, and suppliers will be removed'}</li>
                                <li>{t('settings.factoryReset.warning4') || 'All uploaded files and images will be deleted'}</li>
                                <li>{t('settings.factoryReset.warning5') || 'You will need to run the setup wizard again'}</li>
                            </ul>
                        </div>

                        {/* Info Section */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                {t('settings.factoryReset.whenToUse') || 'When to use Factory Reset'}
                            </h3>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                                <li>{t('settings.factoryReset.useCase1') || 'Starting fresh with a clean installation'}</li>
                                <li>{t('settings.factoryReset.useCase2') || 'Removing all test data before going live'}</li>
                                <li>{t('settings.factoryReset.useCase3') || 'Troubleshooting persistent configuration issues'}</li>
                            </ul>
                        </div>

                        {/* Reset Button */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                variant="outline"
                                onClick={() => setShowResetConfirm(true)}
                                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                                {t('settings.factoryReset.initiateReset') || 'Initiate Factory Reset'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Factory Reset Confirmation Dialog */}
            <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5" />
                            {t('factoryReset')}
                        </DialogTitle>
                        <DialogDescription className="text-red-700 font-semibold">
                            {t('resetWarning')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm">{t('confirmReset')}</p>
                        <div className="space-y-2">
                            <Label htmlFor="reset-confirm">{t('typeResetToConfirm')}</Label>
                            <Input
                                id="reset-confirm"
                                value={resetConfirmation}
                                onChange={(e) => setResetConfirmation(e.target.value)}
                                placeholder="RESET"
                                className="font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowResetConfirm(false); setResetConfirmation(''); }}>
                            {t('cancel')}
                        </Button>
                        <Button
                            onClick={handleFactoryReset}
                            disabled={isResetting || resetConfirmation !== 'RESET'}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isResetting ? t('resetInProgress') : t('resetSettings')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowPathIcon, EnvelopeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/language-context';



export function EmailSettingsTab() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [configured, setConfigured] = useState(false);
    const { t } = useLanguage();

    const schema = z.object({
        smtpHost: z.string().min(1, t('settings.email.validation.host')),
        smtpPort: z.coerce.number().int().min(1).max(65535),
        smtpSecure: z.boolean(),
        smtpUser: z.string().email(t('settings.email.validation.email')),
        smtpPassword: z.string().min(1, t('settings.email.validation.password')),
        fromEmail: z.string().email(t('settings.email.validation.email')),
        fromName: z.string().min(1, t('settings.email.validation.fromName')),
        replyToEmail: z.string().email().optional().or(z.literal(''))
    });

    type EmailSettingsFormData = z.infer<typeof schema>;

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<EmailSettingsFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            smtpHost: '',
            smtpPort: 587,
            smtpSecure: false,
            smtpUser: '',
            smtpPassword: '',
            fromEmail: '',
            fromName: 'RepairFlow',
            replyToEmail: ''
        }
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await fetch('/api/settings/email');
            const data = await res.json();

            if (data.configured && data.settings) {
                setConfigured(true);
                reset({
                    smtpHost: data.settings.smtpHost,
                    smtpPort: data.settings.smtpPort,
                    smtpSecure: data.settings.smtpSecure,
                    smtpUser: data.settings.smtpUser,
                    smtpPassword: '', // Don't populate password
                    fromEmail: data.settings.fromEmail,
                    fromName: data.settings.fromName,
                    replyToEmail: data.settings.replyToEmail || ''
                });
            }
        } catch (error) {
            toast({ title: t('error'), description: t('settings.email.loadError'), variant: 'destructive' });
        }
    };

    const onSubmit = async (data: EmailSettingsFormData) => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || t('settings.email.error'));
            }

            toast({ title: t('success'), description: t('settings.email.success') });
            setConfigured(true);
        } catch (error: any) {
            toast({ title: t('error'), description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const sendTestEmail = async () => {
        setTesting(true);
        try {
            const res = await fetch('/api/settings/email/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (!res.ok) throw new Error(t('settings.email.testError'));

            toast({ title: t('success'), description: t('settings.email.testSuccess') });
        } catch (error) {
            toast({ title: t('error'), description: t('settings.email.testError'), variant: 'destructive' });
        } finally {
            setTesting(false);
        }
    };

    const smtpSecure = watch('smtpSecure');

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="overflow-hidden border-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/25">
                            <EnvelopeIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">{t('settings.email.title') || 'Email Settings'}</CardTitle>
                            <CardDescription>
                                {t('settings.email.description') || 'Configure SMTP settings for sending emails from RepairFlow'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <EnvelopeIcon className="h-5 w-5" />
                        {t('settings.email.smtpServer')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* SMTP Server Settings */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{t('settings.email.smtpServer')}</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="smtpHost">{t('settings.email.host')} *</Label>
                                    <Input
                                        id="smtpHost"
                                        {...register('smtpHost')}
                                        placeholder="smtp.gmail.com"
                                    />
                                    {errors.smtpHost && (
                                        <p className="text-sm text-red-500 mt-1">{errors.smtpHost.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="smtpPort">{t('settings.email.port')} *</Label>
                                    <Input
                                        id="smtpPort"
                                        type="number"
                                        {...register('smtpPort')}
                                        placeholder="587"
                                    />
                                    {errors.smtpPort && (
                                        <p className="text-sm text-red-500 mt-1">{errors.smtpPort.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="smtpSecure"
                                        checked={smtpSecure}
                                        onCheckedChange={(checked) => setValue('smtpSecure', checked)}
                                    />
                                    <Label htmlFor="smtpSecure">{t('settings.email.useTls')}</Label>
                                </div>
                                <p className="text-sm text-muted-foreground ml-8">
                                    Port 587 uses STARTTLS (turn this OFF). Port 465 uses implicit TLS (turn this ON).
                                </p>
                            </div>
                        </div>

                        {/* Authentication */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{t('settings.email.authentication')}</h3>

                            <div>
                                <Label htmlFor="smtpUser">{t('settings.email.username')} *</Label>
                                <Input
                                    id="smtpUser"
                                    type="email"
                                    {...register('smtpUser')}
                                    placeholder="your-email@gmail.com"
                                />
                                {errors.smtpUser && (
                                    <p className="text-sm text-red-500 mt-1">{errors.smtpUser.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="smtpPassword">{t('settings.email.password')} *</Label>
                                <Input
                                    id="smtpPassword"
                                    type="password"
                                    {...register('smtpPassword')}
                                    placeholder={configured ? '••••••••' : 'Enter password'}
                                />
                                {errors.smtpPassword && (
                                    <p className="text-sm text-red-500 mt-1">{errors.smtpPassword.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Email Defaults */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">{t('settings.email.defaults')}</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="fromEmail">{t('settings.email.fromEmail')} *</Label>
                                    <Input
                                        id="fromEmail"
                                        type="email"
                                        {...register('fromEmail')}
                                        placeholder="noreply@repairflow.com"
                                    />
                                    {errors.fromEmail && (
                                        <p className="text-sm text-red-500 mt-1">{errors.fromEmail.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="fromName">{t('settings.email.fromName')} *</Label>
                                    <Input
                                        id="fromName"
                                        {...register('fromName')}
                                        placeholder="RepairFlow"
                                    />
                                    {errors.fromName && (
                                        <p className="text-sm text-red-500 mt-1">{errors.fromName.message}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="replyToEmail">{t('settings.email.replyTo')}</Label>
                                <Input
                                    id="replyToEmail"
                                    type="email"
                                    {...register('replyToEmail')}
                                    placeholder="support@repairflow.com"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
                                {configured ? t('settings.email.update') : t('settings.email.save')}
                            </Button>

                            {configured && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={sendTestEmail}
                                    disabled={testing}
                                >
                                    {testing ? (
                                        <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <PaperAirplaneIcon className="mr-2 h-4 w-4" />
                                    )}
                                    {t('settings.email.sendTest')}
                                </Button>
                            )}
                        </div>
                    </form>

                    {/* Common SMTP Providers Help */}
                    <div className="mt-8 p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">{t('settings.email.providers.title')}</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li><strong>{t('settings.email.providers.gmail')}</strong></li>
                            <li><strong>{t('settings.email.providers.outlook')}</strong></li>
                            <li><strong>{t('settings.email.providers.sendgrid')}</strong></li>
                            <li><strong>{t('settings.email.providers.mailgun')}</strong></li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

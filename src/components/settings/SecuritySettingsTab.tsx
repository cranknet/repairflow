'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface SecuritySettingsTabProps {
    settings: Record<string, string>;
    onSettingChange: (key: string, value: string) => void;
    onSave: () => void;
    isSaving: boolean;
}

function ToggleSetting({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1 pr-4">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

export function SecuritySettingsTab({
    settings,
    onSettingChange,
    onSave,
    isSaving,
}: SecuritySettingsTabProps) {
    const { t } = useLanguage();

    const getBool = (key: string, defaultVal: boolean = false): boolean => {
        const val = settings[key];
        if (val === undefined) return defaultVal;
        return val === 'true' || val === '1';
    };

    const setBool = (key: string, value: boolean) => {
        onSettingChange(key, value ? 'true' : 'false');
    };

    return (
        <div className="space-y-6">
            {/* Password Policy */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.passwordPolicy') || 'Password Policy'}</CardTitle>
                    <CardDescription>{t('settings.passwordPolicyDescription') || 'Configure password requirements for user accounts'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password_min_length">{t('settings.passwordMinLength') || 'Minimum Password Length'}</Label>
                            <Input
                                id="password_min_length"
                                type="number"
                                min="6"
                                max="32"
                                value={settings.password_min_length || '10'}
                                onChange={(e) => onSettingChange('password_min_length', e.target.value)}
                            />
                        </div>
                    </div>

                    <ToggleSetting
                        label={t('settings.passwordRequireUppercase') || 'Require Uppercase Letter'}
                        description={t('settings.passwordRequireUppercaseDescription') || 'Password must contain at least one uppercase letter'}
                        checked={getBool('password_require_uppercase', true)}
                        onChange={(val) => setBool('password_require_uppercase', val)}
                    />

                    <ToggleSetting
                        label={t('settings.passwordRequireNumber') || 'Require Number'}
                        description={t('settings.passwordRequireNumberDescription') || 'Password must contain at least one number'}
                        checked={getBool('password_require_number', true)}
                        onChange={(val) => setBool('password_require_number', val)}
                    />

                    <ToggleSetting
                        label={t('settings.passwordRequireSpecial') || 'Require Special Character'}
                        description={t('settings.passwordRequireSpecialDescription') || 'Password must contain at least one special character (!@#$%^&*)'}
                        checked={getBool('password_require_special')}
                        onChange={(val) => setBool('password_require_special', val)}
                    />
                </CardContent>
            </Card>

            {/* Session Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.sessionSettings') || 'Session Settings'}</CardTitle>
                    <CardDescription>{t('settings.sessionSettingsDescription') || 'Configure user session behavior'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="session_timeout_minutes">{t('settings.sessionTimeout') || 'Session Timeout (Minutes)'}</Label>
                            <Input
                                id="session_timeout_minutes"
                                type="number"
                                min="5"
                                value={settings.session_timeout_minutes || '1440'}
                                onChange={(e) => onSettingChange('session_timeout_minutes', e.target.value)}
                            />
                            <p className="text-xs text-gray-500">Default: 1440 minutes (24 hours)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Login Security */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.loginSecurity') || 'Login Security'}</CardTitle>
                    <CardDescription>{t('settings.loginSecurityDescription') || 'Configure login attempt limits and lockouts'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="max_login_attempts">{t('settings.maxLoginAttempts') || 'Max Failed Login Attempts'}</Label>
                            <Input
                                id="max_login_attempts"
                                type="number"
                                min="3"
                                max="10"
                                value={settings.max_login_attempts || '5'}
                                onChange={(e) => onSettingChange('max_login_attempts', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lockout_duration_minutes">{t('settings.lockoutDuration') || 'Lockout Duration (Minutes)'}</Label>
                            <Input
                                id="lockout_duration_minutes"
                                type="number"
                                min="1"
                                value={settings.lockout_duration_minutes || '15'}
                                onChange={(e) => onSettingChange('lockout_duration_minutes', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="login_log_retention_days">{t('settings.loginLogRetention') || 'Login Log Retention (Days)'}</Label>
                            <Input
                                id="login_log_retention_days"
                                type="number"
                                min="7"
                                value={settings.login_log_retention_days || '90'}
                                onChange={(e) => onSettingChange('login_log_retention_days', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.twoFactorAuth') || 'Two-Factor Authentication'}</CardTitle>
                    <CardDescription>{t('settings.twoFactorAuthDescription') || 'Enhanced security with 2FA'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ToggleSetting
                        label={t('settings.twoFactorEnabled') || 'Enable Two-Factor Authentication'}
                        description={t('settings.twoFactorEnabledDescription') || 'Require 2FA for all admin accounts (Coming Soon)'}
                        checked={getBool('two_factor_enabled')}
                        onChange={(val) => setBool('two_factor_enabled', val)}
                    />
                    {getBool('two_factor_enabled') && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                🚧 Two-factor authentication is coming soon. This setting is saved for future use.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button onClick={onSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? t('loading') : t('saveSettings')}
            </Button>
        </div>
    );
}

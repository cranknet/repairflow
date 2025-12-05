'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlusIcon, EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { adminSchema, type AdminFormData, type InstallState } from '../../lib/validation';

interface AdminStepProps {
    onNext: () => void;
    onBack: () => void;
    installState: InstallState;
    updateState: (updates: Partial<InstallState>) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export function AdminStep({
    onNext,
    onBack,
    installState,
    updateState,
    isLoading,
    setIsLoading
}: AdminStepProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<AdminFormData>({
        resolver: zodResolver(adminSchema),
        defaultValues: installState.admin || {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
        },
    });

    const password = watch('password');
    const confirmPassword = watch('confirmPassword');

    // Password strength calculation
    const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
        if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };

        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd)) score++;

        if (score <= 2) return { score: 1, label: t('resetPassword.passwordWeak') || 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { score: 2, label: t('resetPassword.passwordMedium') || 'Medium', color: 'bg-yellow-500' };
        return { score: 3, label: t('resetPassword.passwordStrong') || 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(password || '');
    const passwordsMatch = password && confirmPassword && password === confirmPassword;

    const onSubmit = async (data: AdminFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/install/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: data.username,
                    email: data.email,
                    password: data.password,
                    name: data.name,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create administrator account');
            }

            // Store without password for display purposes
            updateState({
                admin: {
                    username: data.username,
                    email: data.email,
                    password: '', // Don't store password in state
                    name: data.name,
                }
            });
            onNext();
        } catch (error) {
            toast({
                title: t('error') || 'Error',
                description: error instanceof Error ? error.message : 'Failed to create administrator account',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <UserPlusIcon className="h-16 w-16 text-primary" />
                </div>
                <CardTitle>{t('install.admin.title') || 'Administrator Account'}</CardTitle>
                <CardDescription>
                    {t('install.admin.description') || 'Create your admin account to manage the system.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username">
                            {t('install.admin.usernameLabel') || 'Username'} *
                        </Label>
                        <Input
                            id="username"
                            {...register('username')}
                            placeholder={t('install.admin.usernamePlaceholder') || 'admin'}
                            autoComplete="username"
                        />
                        {errors.username && (
                            <p className="text-sm text-red-500">{errors.username.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            {t('install.admin.emailLabel') || 'Email Address'} *
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder={t('install.admin.emailPlaceholder') || 'admin@myrepairshop.com'}
                            autoComplete="email"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            {t('install.admin.nameLabel') || 'Full Name'} *
                        </Label>
                        <Input
                            id="name"
                            {...register('name')}
                            placeholder={t('install.admin.namePlaceholder') || 'John Doe'}
                            autoComplete="name"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">
                            {t('install.admin.passwordLabel') || 'Password'} *
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                placeholder={t('install.admin.passwordPlaceholder') || 'Enter a secure password'}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        {password && (
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${passwordStrength.color} transition-all`}
                                        style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                                    />
                                </div>
                                <span className={`text-sm ${passwordStrength.score === 1 ? 'text-red-500' :
                                        passwordStrength.score === 2 ? 'text-yellow-500' : 'text-green-500'
                                    }`}>
                                    {passwordStrength.label}
                                </span>
                            </div>
                        )}
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                            {t('install.admin.confirmPasswordLabel') || 'Confirm Password'} *
                        </Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                {...register('confirmPassword')}
                                placeholder={t('install.admin.confirmPasswordPlaceholder') || 'Re-enter your password'}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        {confirmPassword && (
                            <div className="flex items-center gap-1 text-sm">
                                {passwordsMatch ? (
                                    <>
                                        <CheckIcon className="h-4 w-4 text-green-500" />
                                        <span className="text-green-500">{t('resetPassword.passwordMatch') || 'Passwords match'}</span>
                                    </>
                                ) : (
                                    <>
                                        <XMarkIcon className="h-4 w-4 text-red-500" />
                                        <span className="text-red-500">{t('resetPassword.passwordMismatch') || 'Passwords do not match'}</span>
                                    </>
                                )}
                            </div>
                        )}
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {/* Role (Fixed) */}
                    <div className="space-y-2">
                        <Label>{t('install.admin.roleLabel') || 'Role'}</Label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-400">
                            {t('install.admin.roleFixed') || 'Administrator (fixed)'}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between pt-6">
                        <Button type="button" variant="outlined" onClick={onBack} disabled={isLoading}>
                            {t('install.nav.back') || 'Back'}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    {t('creating') || 'Creating...'}
                                </span>
                            ) : (
                                t('install.nav.next') || 'Next'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

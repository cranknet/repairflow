'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlusIcon, EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon, ArrowLeftIcon, ArrowRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <UserPlusIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {t('install.admin.title') || 'Administrator Account'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('install.admin.description') || 'Create your admin account to manage the system.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
                {/* Two column layout for username and email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium">
                            {t('install.admin.usernameLabel') || 'Username'} *
                        </Label>
                        <Input
                            id="username"
                            {...register('username')}
                            placeholder={t('install.admin.usernamePlaceholder') || 'admin'}
                            autoComplete="username"
                            className="h-11"
                            aria-invalid={!!errors.username}
                        />
                        {errors.username && (
                            <p className="text-sm text-red-500 flex items-center gap-1" role="alert">
                                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                                {errors.username.message}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                            {t('install.admin.emailLabel') || 'Email Address'} *
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder={t('install.admin.emailPlaceholder') || 'admin@myrepairshop.com'}
                            autoComplete="email"
                            className="h-11"
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500 flex items-center gap-1" role="alert">
                                <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                                {errors.email.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Name - full width */}
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                        {t('install.admin.nameLabel') || 'Full Name'} *
                    </Label>
                    <Input
                        id="name"
                        {...register('name')}
                        placeholder={t('install.admin.namePlaceholder') || 'John Doe'}
                        autoComplete="name"
                        className="h-11"
                        aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-500 flex items-center gap-1" role="alert">
                            <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/* Password Section */}
                <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <ShieldCheckIcon className="h-4 w-4 text-primary" />
                        {t('install.admin.securitySection') || 'Security'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                {t('install.admin.passwordLabel') || 'Password'} *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    placeholder={t('install.admin.passwordPlaceholder') || 'Enter a secure password'}
                                    autoComplete="new-password"
                                    className="h-11 pr-10"
                                    aria-invalid={!!errors.password}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            {password && (
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                            style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-medium ${passwordStrength.score === 1 ? 'text-red-500' :
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
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                {t('install.admin.confirmPasswordLabel') || 'Confirm Password'} *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    {...register('confirmPassword')}
                                    placeholder={t('install.admin.confirmPasswordPlaceholder') || 'Re-enter your password'}
                                    autoComplete="new-password"
                                    className="h-11 pr-10"
                                    aria-invalid={!!errors.confirmPassword}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            {confirmPassword && (
                                <div className="flex items-center gap-1.5 text-sm mt-2">
                                    {passwordsMatch ? (
                                        <>
                                            <CheckIcon className="h-4 w-4 text-green-500" />
                                            <span className="text-green-500 text-xs">{t('resetPassword.passwordMatch') || 'Passwords match'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <XMarkIcon className="h-4 w-4 text-red-500" />
                                            <span className="text-red-500 text-xs">{t('resetPassword.passwordMismatch') || 'Passwords do not match'}</span>
                                        </>
                                    )}
                                </div>
                            )}
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Role Badge */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShieldCheckIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {t('install.admin.roleLabel') || 'Role'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('install.admin.roleFixed') || 'Administrator (fixed)'}
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-slate-700">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        {t('install.nav.back') || 'Back'}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="gap-2 min-w-[140px]"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                                {t('creating') || 'Creating...'}
                            </span>
                        ) : (
                            <>
                                {t('install.nav.next') || 'Next'}
                                <ArrowRightIcon className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}


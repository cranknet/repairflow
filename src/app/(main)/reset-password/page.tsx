'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
import { ArrowLeftIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { companyName } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const token = searchParams.get('token');

  // Calculate password strength
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: t('resetPassword.passwordWeak') || 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { strength, label: t('resetPassword.passwordMedium') || 'Medium', color: 'bg-yellow-500' };
    return { strength, label: t('resetPassword.passwordStrong') || 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (response.ok && data.valid) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('resetPassword.errorTitle') || 'Error',
        description: t('resetPassword.passwordMismatch') || 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: t('resetPassword.errorTitle') || 'Error',
        description: t('resetPassword.passwordTooShort') || 'Password must be at least 8 characters long',
        variant: 'destructive',
      });
      return;
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast({
        title: t('resetPassword.errorTitle') || 'Error',
        description: t('resetPassword.passwordComplexity') || 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('resetPassword.errorMessage') || 'Failed to reset password');
      }

      toast({
        title: t('resetPassword.successTitle') || 'Success',
        description: t('resetPassword.successMessage') || 'Your password has been reset successfully',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('resetPassword.errorMessage') || 'An error occurred. Please try again.';
      toast({
        title: t('resetPassword.errorTitle') || 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-gray-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900" />

        <div className="relative z-10 w-full max-w-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
            <div className="flex items-center justify-center gap-3">
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary/30 border-t-primary" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('resetPassword.validating') || 'Validating reset token...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-50 via-gray-50 to-gray-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900" />

        <div className="relative z-10 w-full max-w-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-red-50 to-white dark:from-slate-800 dark:to-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('resetPassword.invalidTokenTitle') || 'Invalid or Expired Link'}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('resetPassword.invalidTokenDescription') || 'This password reset link is invalid or has expired'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {t('resetPassword.tokenExpiredMessage') || 'Password reset links expire after 1 hour. Please request a new one.'}
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push('/forgot-password')}
                  className="w-full h-11"
                >
                  {t('resetPassword.requestNewLink') || 'Request New Reset Link'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="w-full h-11 gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  {t('resetPassword.backToLogin') || 'Back to Login'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs">
          © {new Date().getFullYear()} {companyName || 'RepairFlow'}
        </div>
      </div>
    );
  }

  // Valid token - show reset form
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-gray-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900" />

      <div className="relative z-10 w-full max-w-md animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <LockClosedIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('resetPassword.title') || 'Reset Password'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('resetPassword.description') || 'Enter your new password'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t('resetPassword.newPasswordLabel') || 'New Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('resetPassword.passwordPlaceholder') || 'Enter new password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{t('resetPassword.passwordStrength') || 'Password Strength'}:</span>
                    <span className={cn(
                      'font-medium',
                      passwordStrength.color === 'bg-red-500' && 'text-red-500',
                      passwordStrength.color === 'bg-yellow-500' && 'text-yellow-500',
                      passwordStrength.color === 'bg-green-500' && 'text-green-500'
                    )}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-300', passwordStrength.color)}
                      style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                {t('resetPassword.confirmPasswordLabel') || 'Confirm Password'}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder') || 'Confirm new password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className={cn(
                    "h-11 pr-10",
                    formData.confirmPassword && formData.password !== formData.confirmPassword && 'border-red-500 focus:border-red-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="flex items-center gap-1.5 text-xs">
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
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || !passwordsMatch || formData.password.length < 8}
              className="w-full h-11"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  {t('resetPassword.resetting') || 'Resetting...'}
                </span>
              ) : (
                t('resetPassword.submitButton') || 'Reset Password'
              )}
            </Button>

            {/* Back to login */}
            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                {t('resetPassword.backToLogin') || 'Back to Login'}
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs">
        © {new Date().getFullYear()} {companyName || 'RepairFlow'}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

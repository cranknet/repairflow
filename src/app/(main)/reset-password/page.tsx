'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
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
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const token = searchParams.get('token');

  useEffect(() => {
    // Load background image similar to login page
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        const defaultImage = data.default_login_image || '/default-login-bg.png';
        setBackgroundImage(defaultImage);
      })
      .catch(() => {
        setBackgroundImage('/default-login-bg.png');
      });
  }, []);

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
      } catch (error) {
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
    } catch (error: any) {
      toast({
        title: t('resetPassword.errorTitle') || 'Error',
        description: error.message || t('resetPassword.errorMessage') || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        style={{
          backgroundImage: backgroundImage ? `url("${backgroundImage}")` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80 backdrop-blur-sm" />
        <Card
          className={cn(
            "w-full max-w-md relative z-10 shadow-2xl border-0 ring-1 ring-white/10",
            "bg-black/40 backdrop-blur-xl text-white overflow-hidden"
          )}
        >
          <CardContent className="pt-6 pb-8 px-8">
            <div className="flex items-center justify-center gap-3">
              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              <p className="text-center text-gray-300">{t('resetPassword.validating') || 'Validating reset token...'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        style={{
          backgroundImage: backgroundImage ? `url("${backgroundImage}")` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80 backdrop-blur-sm" />
        <Card
          className={cn(
            "w-full max-w-md relative z-10 shadow-2xl border-0 ring-1 ring-white/10",
            "bg-black/40 backdrop-blur-xl text-white overflow-hidden"
          )}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
          <CardHeader className="space-y-6 pb-2 pt-8">
            <div className="flex flex-col items-center gap-4">
              <div className="text-center space-y-1.5">
                <CardTitle className="text-3xl font-bold tracking-tight text-red-400">
                  {t('resetPassword.invalidTokenTitle') || 'Invalid or Expired Link'}
                </CardTitle>
                <p className="text-blue-200/70 text-sm font-medium tracking-widest uppercase">
                  {companyName || 'REPAIR FLOW'}
                </p>
              </div>
            </div>
            <CardDescription className="text-center text-gray-400 text-base pt-2">
              {t('resetPassword.invalidTokenDescription') || 'This password reset link is invalid or has expired'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-8 px-8">
            <div className="space-y-4">
              <p className="text-sm text-gray-300 text-center">
                {t('resetPassword.tokenExpiredMessage') || 'Password reset links expire after 1 hour. Please request a new one.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push('/forgot-password')}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-900/30 border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl"
                >
                  {t('resetPassword.requestNewLink') || 'Request New Reset Link'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/login')}
                  className="w-full h-12 border-white/20 text-white hover:bg-white/10"
                >
                  {t('resetPassword.backToLogin') || 'Back to Login'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundImage: backgroundImage ? `url("${backgroundImage}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80 backdrop-blur-sm" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
      </div>
      <Card
        className={cn(
          "w-full max-w-md relative z-10 shadow-2xl border-0 ring-1 ring-white/10",
          "bg-black/40 backdrop-blur-xl text-white overflow-hidden"
        )}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        <CardHeader className="space-y-6 pb-2 pt-8">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center space-y-1.5">
              <CardTitle className="text-3xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                {t('resetPassword.title') || 'Reset Password'}
              </CardTitle>
              <p className="text-blue-200/70 text-sm font-medium tracking-widest uppercase">
                {companyName || 'REPAIR FLOW'}
              </p>
            </div>
          </div>
          <CardDescription className="text-center text-gray-400 text-base pt-2">
            {t('resetPassword.description') || 'Enter your new password'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">
                {t('resetPassword.newPasswordLabel') || 'New Password'}
              </label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('resetPassword.passwordPlaceholder') || 'Enter new password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-blue-500/20 h-12 pl-11 pr-11 transition-all duration-300 rounded-xl group-hover:bg-white/10"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors">lock</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-500 hover:text-blue-400 transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{t('resetPassword.passwordStrength') || 'Password Strength'}:</span>
                    <span className={cn(
                      'font-semibold',
                      passwordStrength.color === 'bg-red-500' && 'text-red-400',
                      passwordStrength.color === 'bg-yellow-500' && 'text-yellow-400',
                      passwordStrength.color === 'bg-green-500' && 'text-green-400'
                    )}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-300', passwordStrength.color)}
                      style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">
                {t('resetPassword.confirmPasswordLabel') || 'Confirm Password'}
              </label>
              <div className="relative group">
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
                    "w-full bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-blue-500/20 h-12 pl-11 pr-11 transition-all duration-300 rounded-xl group-hover:bg-white/10",
                    formData.confirmPassword && formData.password !== formData.confirmPassword && 'border-red-500/50'
                  )}
                />
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors">lock</span>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-gray-500 hover:text-blue-400 transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-400">{t('resetPassword.passwordMismatch') || 'Passwords do not match'}</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length > 0 && (
                <p className="text-xs text-green-400">{t('resetPassword.passwordMatch') || 'Passwords match'}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-900/30 border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl mt-2"
              disabled={isLoading || formData.password !== formData.confirmPassword || formData.password.length < 8}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  {t('resetPassword.resetting') || 'Resetting...'}
                </span>
              ) : (
                t('resetPassword.submitButton') || 'Reset Password'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors hover:underline underline-offset-4"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {t('resetPassword.backToLogin') || 'Back to Login'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}


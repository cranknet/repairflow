'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
import { ArrowLeftIcon, EnvelopeIcon, PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { companyName } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: t('forgotPassword.invalidEmail') || 'Invalid Email',
        description: t('forgotPassword.invalidEmailMessage') || 'Please enter a valid email address',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('forgotPassword.errorMessage') || 'Failed to send reset email');
      }

      toast({
        title: t('forgotPassword.successTitle') || 'Success',
        description: t('forgotPassword.successMessage') || 'If an account exists with this email, a password reset link has been sent.',
      });
      setIsSubmitted(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('forgotPassword.errorMessage') || 'An error occurred. Please try again.';
      toast({
        title: t('forgotPassword.errorTitle') || 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-50 via-gray-50 to-gray-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900" />

        <div className="relative z-10 w-full max-w-md animate-fadeIn">
          <div
            className={cn(
              "bg-white dark:bg-slate-800 rounded-2xl",
              "shadow-sm border border-gray-100 dark:border-slate-700",
              "overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-green-50 to-white dark:from-slate-800 dark:to-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('forgotPassword.checkEmailTitle') || 'Check Your Email'}
                  </h1>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('forgotPassword.checkEmailDescription', { email }) || `We've sent a password reset link to ${email}`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {t('forgotPassword.checkEmailInstructions') || 'Please check your email and click the link to reset your password. The link will expire in 1 hour.'}
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-11 gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  {t('forgotPassword.backToLogin') || 'Back to Login'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full h-11"
                >
                  {t('forgotPassword.sendAnotherEmail') || 'Send Another Email'}
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-8">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-gray-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md animate-fadeIn">
        <div
          className={cn(
            "bg-white dark:bg-slate-800 rounded-2xl",
            "shadow-sm border border-gray-100 dark:border-slate-700",
            "overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <EnvelopeIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('forgotPassword.title') || 'Forgot Password'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('forgotPassword.description') || 'Enter your email address and we\'ll send you a link to reset your password'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t('forgotPassword.emailLabel') || 'Email Address'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('forgotPassword.emailPlaceholder') || 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 gap-2"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  {t('forgotPassword.sending') || 'Sending...'}
                </span>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {t('forgotPassword.submitButton') || 'Send Reset Link'}
                </>
              )}
            </Button>

            {/* Back to login */}
            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                {t('forgotPassword.backToLogin') || 'Back to Login'}
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
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
  const [backgroundImage, setBackgroundImage] = useState<string>('');

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
    } catch (error: any) {
      toast({
        title: t('forgotPassword.errorTitle') || 'Error',
        description: error.message || t('forgotPassword.errorMessage') || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
          <CardHeader className="space-y-6 pb-2 pt-8">
            <div className="flex flex-col items-center gap-4">
              <div className="text-center space-y-1.5">
                <CardTitle className="text-3xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                  {t('forgotPassword.checkEmailTitle') || 'Check Your Email'}
                </CardTitle>
              </div>
            </div>
            <CardDescription className="text-center text-gray-400 text-base pt-2">
              {t('forgotPassword.checkEmailDescription', { email }) || `We've sent a password reset link to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-8 px-8">
            <div className="space-y-4">
              <p className="text-sm text-gray-300 text-center">
                {t('forgotPassword.checkEmailInstructions') || 'Please check your email and click the link to reset your password. The link will expire in 1 hour.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-900/30 border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl"
                >
                  {t('forgotPassword.backToLogin') || 'Back to Login'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full h-12 border-white/20 text-white hover:bg-white/10"
                >
                  {t('forgotPassword.sendAnotherEmail') || 'Send Another Email'}
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
                {t('forgotPassword.title') || 'Forgot Password'}
              </CardTitle>
              <p className="text-blue-200/70 text-sm font-medium tracking-widest uppercase">
                {companyName || 'REPAIR FLOW'}
              </p>
            </div>
          </div>
          <CardDescription className="text-center text-gray-400 text-base pt-2">
            {t('forgotPassword.description') || 'Enter your email address and we\'ll send you a link to reset your password'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">
                {t('forgotPassword.emailLabel') || 'Email Address'}
              </label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder={t('forgotPassword.emailPlaceholder') || 'Enter your email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-blue-500/20 h-12 pl-11 transition-all duration-300 rounded-xl group-hover:bg-white/10"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors">email</span>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-900/30 border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  {t('forgotPassword.sending') || 'Sending...'}
                </span>
              ) : (
                t('forgotPassword.submitButton') || 'Send Reset Link'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors hover:underline underline-offset-4"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {t('forgotPassword.backToLogin') || 'Back to Login'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


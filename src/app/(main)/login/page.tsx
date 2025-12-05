'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
import { LoginSidebar } from '@/components/auth/login-sidebar';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { companyName } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Load remembered username from localStorage
    const rememberedUsername = localStorage.getItem('remembered_username');
    if (rememberedUsername) {
      setFormData((prev) => ({ ...prev, username: rememberedUsername }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username: formData.username,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: t('error') || 'Error',
          description: t('auth.login.error.invalid'),
          variant: 'destructive',
        });
      } else {
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('remembered_username', formData.username);
        } else {
          localStorage.removeItem('remembered_username');
        }

        toast({
          title: t('success') || 'Success',
          description: t('auth.login.submit'),
        });
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: t('error') || 'Error',
        description: t('auth.login.error.generic'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-8">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-gray-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[900px] grid grid-cols-1 lg:grid-cols-5 gap-0 animate-fadeIn">

        {/* Left: Login Form (3/5 width on desktop) */}
        <div className="lg:col-span-3">
          <div
            className={cn(
              "bg-white dark:bg-slate-800 rounded-2xl lg:rounded-r-none",
              "shadow-sm border border-gray-100 dark:border-slate-700",
              "overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">login</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('auth.login.title')}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('auth.login.subtitle')}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  {t('auth.login.username')}
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t('auth.login.usernamePlaceholder')}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-11"
                  aria-invalid={false}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t('auth.login.password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.login.passwordPlaceholder')}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10"
                    aria-invalid={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rememberMe}
                    onClick={() => setRememberMe(!rememberMe)}
                    disabled={isLoading}
                    className={cn(
                      "h-5 w-5 rounded flex items-center justify-center border-2 transition-all duration-200",
                      rememberMe
                        ? "bg-primary border-primary text-white"
                        : "border-gray-300 dark:border-slate-600 bg-transparent hover:border-gray-400"
                    )}
                  >
                    {rememberMe && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <label
                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none"
                    onClick={() => !isLoading && setRememberMe(!rememberMe)}
                  >
                    {t('auth.login.remember')}
                  </label>
                </div>

                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {t('auth.login.forgot')}
                </Link>
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
                    {t('auth.login.submitting')}
                  </span>
                ) : (
                  <>
                    {t('auth.login.submit')}
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Right: Sidebar (2/5 width) - Desktop only */}
        <div className="hidden lg:block lg:col-span-2">
          <LoginSidebar className="rounded-l-none" />
        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs">
        © {new Date().getFullYear()} {companyName || 'RepairFlow'}
      </div>
    </div>
  );
}

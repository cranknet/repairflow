'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useSettings } from '@/contexts/settings-context';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { companyName } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
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
          title: 'Login Failed',
          description: 'Invalid username or password',
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
          title: 'Success',
          description: 'Logged in successfully',
        });
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url("/default-login-bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80 backdrop-blur-sm" />

      {/* Decorative Elements */}
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
        {/* Card Top Highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

        <CardHeader className="space-y-6 pb-2 pt-8">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center space-y-1.5">
              <CardTitle className="text-3xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                {companyName || 'REPAIR FLOW'}
              </CardTitle>
              <p className="text-blue-200/70 text-sm font-medium tracking-widest uppercase">
                Management System
              </p>
            </div>
          </div>
          <CardDescription className="text-center text-gray-400 text-base pt-2">
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">Username</label>
              <div className="relative group">
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={isLoading}
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-blue-500/20 h-12 pl-11 transition-all duration-300 rounded-xl group-hover:bg-white/10"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors">person</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-blue-500/50 focus:ring-blue-500/20 h-12 pl-11 transition-all duration-300 rounded-xl group-hover:bg-white/10"
                />
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-gray-500 group-focus-within:text-blue-400 transition-colors">lock</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  disabled={isLoading}
                  className={cn(
                    "h-5 w-5 rounded-md flex items-center justify-center border transition-all duration-200",
                    rememberMe
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/50"
                      : "border-gray-600 bg-transparent hover:border-gray-400"
                  )}
                >
                  {rememberMe && (
                    <span className="material-symbols-outlined text-[14px] font-bold">
                      check
                    </span>
                  )}
                </button>
                <label
                  htmlFor="remember-me"
                  className="text-sm text-gray-300 cursor-pointer select-none hover:text-white transition-colors"
                  onClick={() => !isLoading && setRememberMe(!rememberMe)}
                >
                  {t('rememberMe')}
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors hover:underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-900/30 border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="absolute bottom-6 text-gray-500/50 text-xs tracking-[0.2em] uppercase font-medium">
        © {new Date().getFullYear()} {companyName || 'RepairFlow'}. All rights reserved.
      </div>
    </div>
  );
}

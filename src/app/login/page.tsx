'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Material Design 3 Login Page
 * 
 * Implements MD3 patterns for authentication with proper
 * form styling, elevation, and accessibility.
 */

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('RepairFlow');
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

    // Fetch settings for background and logo
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        console.log('Settings data received:', data);
        if (data.login_background_image_url) {
          setBackgroundImage(data.login_background_image_url);
        } else if (data.login_background_image) {
          setBackgroundImage(data.login_background_image);
        }
        if (data.company_logo) {
          // Ensure the logo path is correct (handle both relative and absolute paths)
          const logoPath = data.company_logo.startsWith('http') 
            ? data.company_logo 
            : data.company_logo.startsWith('/') 
            ? data.company_logo 
            : `/${data.company_logo}`;
          setCompanyLogo(logoPath);
          console.log('Company logo set to:', logoPath);
        } else {
          console.log('No company logo found in settings. Available keys:', Object.keys(data));
        }
        if (data.company_name) {
          setCompanyName(data.company_name);
        }
      })
      .catch((error) => {
        console.error('Error fetching settings:', error);
      });
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
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative bg-background"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for better readability */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-scrim/60 backdrop-blur-sm" />
      )}
      
      <Card 
        variant="elevated" 
        className={cn(
          "w-full max-w-md relative z-10 shadow-md-level3",
          backgroundImage && "bg-surface/95 backdrop-blur-md"
        )}
      >
        <CardHeader className="space-y-3">
          <div className="flex flex-col items-center gap-4">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Company Logo"
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  console.error('Failed to load company logo:', companyLogo);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Company logo loaded successfully:', companyLogo);
                }}
              />
            ) : (
              <div className="h-16 w-16 bg-primary-container rounded-2xl flex items-center justify-center shadow-md-level1">
                <span className="material-symbols-rounded text-4xl text-on-primary-container">
                  build
                </span>
              </div>
            )}
            <CardTitle className="text-headline-medium font-normal text-on-surface text-center">
              {companyName}
            </CardTitle>
          </div>
          <CardDescription className="text-center text-body-large">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="username"
              type="text"
              label="Username"
              variant="outlined"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={isLoading}
              leadingIcon={<span className="material-symbols-outlined">person</span>}
            />
            
            <Input
              id="password"
              type="password"
              label="Password"
              variant="outlined"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
              leadingIcon={<span className="material-symbols-outlined">lock</span>}
            />
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                disabled={isLoading}
                className={cn(
                  "h-5 w-5 rounded flex items-center justify-center border-2 transition-all duration-short2 ease-standard",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary",
                  rememberMe
                    ? "bg-primary border-primary"
                    : "border-outline bg-transparent hover:border-on-surface"
                )}
              >
                {rememberMe && (
                  <span className="material-symbols-outlined text-[16px] text-on-primary">
                    check
                  </span>
                )}
              </button>
              <label 
                htmlFor="remember-me" 
                className="text-body-medium text-on-surface cursor-pointer select-none"
                onClick={() => !isLoading && setRememberMe(!rememberMe)}
              >
                {t('rememberMe')}
              </label>
            </div>
            
            <Button 
              type="submit" 
              variant="filled"
              className="w-full h-12"
              disabled={isLoading}
              icon={isLoading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined">login</span>
              )}
              iconPosition="start"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-body-medium text-primary hover:text-primary/80 transition-colors duration-short2 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary rounded px-2 py-1"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
              Forgot your password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';

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
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      
      <Card className="w-full max-w-md relative z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col items-center gap-3">
            {companyLogo && (
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
            )}
            <CardTitle className="text-2xl font-bold text-center">{companyName}</CardTitle>
          </div>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              />
              <Label htmlFor="remember-me" className="ml-2 text-sm text-gray-700 cursor-pointer">
                {t('rememberMe')}
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Forgot your password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


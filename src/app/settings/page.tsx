import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsClient } from '@/components/settings/settings-client';

export default async function SettingsPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [settings, users] = await Promise.all([
    prisma.settings.findMany(),
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system settings and users</p>
        </div>

        <SettingsClient initialSettings={settingsMap} initialUsers={users} />
      </div>
    </MainLayout>
  );
}


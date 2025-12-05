import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsClient } from '@/components/settings/settings-client';
import { PageHeader } from '@/components/layout/page-header';

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

  // Serialize dates for client component
  const serializedUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-6 pt-6">
      <PageHeader
        titleKey="settings"
        descriptionKey="manageSystemSettings"
      />

      <SettingsClient initialSettings={settingsMap} initialUsers={serializedUsers} />
    </div>
  );
}


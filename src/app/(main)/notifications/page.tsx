import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationsList } from '@/components/notifications/notifications-list';

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; unreadOnly?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const type = params.type;
  const unreadOnly = params.unreadOnly === 'true';

  const where: any = {
    userId: session.user.id,
  };

  if (unreadOnly) {
    where.read = false;
  }

  if (type) {
    where.type = type;
  }

  const notifications = await prisma.notification.findMany({
    where,
    include: {
      ticket: {
        select: {
          ticketNumber: true,
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert Date objects to strings for client component
  const serializedNotifications = notifications.map((notification) => ({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 pt-6">
      <NotificationsList notifications={serializedNotifications} />
    </div>
  );
}


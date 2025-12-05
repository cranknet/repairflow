import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContactMessagesClient } from '@/components/contact/contact-messages-client';

export default async function ContactMessagesPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  // Only ADMIN and STAFF can access
  if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
    redirect('/dashboard');
  }

  // Fetch all contact messages
  const messages = await prisma.contactMessage.findMany({
    include: {
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Serialize messages data for client component
  const serializedMessages = messages.map((message) => ({
    ...message,
    status: message.status as 'NEW' | 'READ' | 'ARCHIVED',
    createdAt: message.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {session.user.role === 'ADMIN' ? 'Contact Messages' : 'Contact Messages'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage customer contact messages
        </p>
      </div>
      <ContactMessagesClient
        initialMessages={serializedMessages}
        canDelete={session.user.role === 'ADMIN'}
      />
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export function InboxIcon() {
  const { data: session } = useSession();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return;
    }

    // Fetch unread contact messages count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/contact/messages?status=NEW');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setUnreadCount(data.length);
          }
        }
      } catch (error) {
        console.error('Error fetching unread contact messages count:', error);
      }
    };

    fetchUnreadCount();

    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
    return null;
  }

  const handleClick = () => {
    router.push('/contact-messages');
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={cn(
          'relative p-2 rounded-full text-on-surface-variant transition-all duration-short2 ease-standard',
          'hover:bg-on-surface/8 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary',
          'md-state-layer-hover'
        )}
        aria-label="Inbox"
        title="Inbox"
      >
        <EnvelopeIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-error text-on-error text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { ChatPanel } from './chat-panel';

export function ChatBell() {
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await fetch('/api/chats/unread-count');
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.totalUnread || 0);
            } else {
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error fetching chat unread count:', error);
            setUnreadCount(0);
        }
    }, []);

    useEffect(() => {
        if (!session) return;

        fetchUnreadCount();

        // Poll for unread messages every 2 seconds for faster updates
        const interval = setInterval(fetchUnreadCount, 2000);

        return () => clearInterval(interval);
    }, [session, fetchUnreadCount]);

    if (!session) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Team Chat"
            >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <ChatPanel
                    onClose={() => setIsOpen(false)}
                    onMessageRead={fetchUnreadCount}
                />
            )}
        </div>
    );
}

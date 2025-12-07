'use client';

import { useState, useCallback } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/language-context';
import { ChatWindow } from '@/components/chat/chat-window';

interface TicketChatButtonProps {
    ticketId: string;
    ticketNumber: string;
}

export function TicketChatButton({ ticketId, ticketNumber }: TicketChatButtonProps) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch or create chat for this ticket
    const openChat = useCallback(async () => {
        setIsLoading(true);
        try {
            // Create/get chat for this ticket
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId }),
            });

            if (response.ok) {
                const data = await response.json();
                setChatId(data.chat.id);
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Error opening chat:', error);
        } finally {
            setIsLoading(false);
        }
    }, [ticketId]);

    const closeChat = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
                        {t('chat.ticketChat') || 'Team Chat'}
                    </h3>
                    {unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={openChat}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-colors"
                >
                    {isLoading ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t('loading') || 'Loading...'}
                        </>
                    ) : (
                        <>
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                            {t('chat.openChat') || 'Open Chat'}
                        </>
                    )}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {t('chat.collaborateHint') || 'Collaborate with your team on this repair'}
                </p>
            </div>

            {/* Chat Window Modal */}
            {isOpen && chatId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                        <ChatWindow
                            chatId={chatId}
                            onBack={closeChat}
                            onClose={closeChat}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

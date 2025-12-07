'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { XMarkIcon, TicketIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { ChatWindow } from './chat-window';
import { useLanguage } from '@/contexts/language-context';

interface ChatPreview {
    id: string;
    name: string | null;
    ticketId: string | null;
    isTicketChat: boolean;
    lastMessageAt: string | null;
    unreadCount: number;
    lastMessage?: {
        content: string;
        sender: { name: string | null; username: string };
    };
    ticket?: {
        ticketNumber: string;
        deviceBrand: string;
        deviceModel: string;
        status: string;
    };
    participants: Array<{
        user: { id: string; name: string | null; username: string };
    }>;
}

interface ChatPanelProps {
    onClose: () => void;
    onMessageRead: () => void;
}

export function ChatPanel({ onClose, onMessageRead }: ChatPanelProps) {
    const { t } = useLanguage();
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const fetchChats = useCallback(async () => {
        try {
            // Always fetch ticket chats only
            const response = await fetch('/api/chats?ticketOnly=true');
            if (response.ok) {
                const data = await response.json();
                setChats(data.chats || []);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChats();
        // Poll for new chats every 5 seconds
        const interval = setInterval(fetchChats, 5000);
        return () => clearInterval(interval);
    }, [fetchChats]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    function formatTime(dateString: string | null) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isToday(date)) return format(date, 'HH:mm');
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d');
    }

    function getChatDisplayName(chat: ChatPreview, currentUserId?: string) {
        if (chat.isTicketChat && chat.ticket) {
            return `#${chat.ticket.ticketNumber} - ${chat.ticket.deviceBrand} ${chat.ticket.deviceModel}`;
        }
        if (chat.name) return chat.name;
        // For unnamed group chats, show participant names
        const otherParticipants = chat.participants
            .filter((p) => p.user.id !== currentUserId)
            .map((p) => p.user.name || p.user.username);
        return otherParticipants.slice(0, 3).join(', ') || 'Chat';
    }

    if (selectedChatId) {
        return (
            <div
                ref={panelRef}
                className="absolute right-0 top-12 z-50 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
                <ChatWindow
                    chatId={selectedChatId}
                    onBack={() => {
                        setSelectedChatId(null);
                        fetchChats();
                        onMessageRead();
                    }}
                    onClose={onClose}
                />
            </div>
        );
    }

    return (
        <div
            ref={panelRef}
            className="absolute right-0 top-12 z-50 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('chat.ticketChats')}
                </h2>
                <button
                    onClick={onClose}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    aria-label={t('chat.close')}
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>


            {/* Chat list */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                        <ChatBubbleLeftRightIcon className="h-12 w-12 mb-3 opacity-50" />
                        <p className="text-sm">{t('chat.noTicketChats')}</p>
                        <p className="text-xs mt-1">{t('chat.openTicketHint')}</p>
                    </div>

                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {chats.map((chat) => (
                            <li key={chat.id}>
                                <button
                                    onClick={() => setSelectedChatId(chat.id)}
                                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                >
                                    {/* Icon */}
                                    <div
                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${chat.isTicketChat
                                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}
                                    >
                                        {/* All chats are ticket chats */}
                                        <TicketIcon className="h-5 w-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white truncate">
                                                {getChatDisplayName(chat)}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                {formatTime(chat.lastMessageAt)}
                                            </span>
                                        </div>
                                        {chat.lastMessage && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                <span className="font-medium">
                                                    {chat.lastMessage.sender.name || chat.lastMessage.sender.username}:
                                                </span>{' '}
                                                {chat.lastMessage.content}
                                            </p>
                                        )}
                                    </div>

                                    {/* Unread badge */}
                                    {chat.unreadCount > 0 && (
                                        <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                                            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

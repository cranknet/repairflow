'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
    ArrowLeftIcon,
    XMarkIcon,
    UserCircleIcon,
    EllipsisVerticalIcon,
    TicketIcon,
    TrashIcon,
    LockClosedIcon,
    LockOpenIcon,
    PencilIcon,
    ChatBubbleOvalLeftIcon,
    PaperClipIcon,
} from '@heroicons/react/24/outline';
import { MentionInput } from './mention-input';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/language-context';

interface Reaction {
    id: string;
    emoji: string;
    userId: string;
}

interface ReplyTo {
    id: string;
    content: string;
    sender: { name: string | null; username: string };
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    isEdited?: boolean;
    sender: {
        id: string;
        name: string | null;
        username: string;
    };
    reactions?: Reaction[];
    replyTo?: ReplyTo | null;
    attachments?: string; // JSON string
}

interface ChatWindowProps {
    chatId: string;
    onBack: () => void;
    onClose: () => void;
}

interface TicketInfo {
    id: string;
    ticketNumber: string;
    deviceBrand: string;
    deviceModel: string;
}

export function ChatWindow({ chatId, onBack, onClose }: ChatWindowProps) {
    const { data: session } = useSession();
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chatName, setChatName] = useState('Chat');
    const [chatStatus, setChatStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
    const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    // Reply and edit state
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Common emoji reactions
    const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

    // Helper to render a text segment, detecting @mentions
    const renderMentions = (text: string, baseKey: string) => {
        const mentionRegex = /@(\w+)/g;
        const parts = text.split(mentionRegex);

        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return (
                    <span key={`${baseKey}-mention-${index}`} className="text-blue-600 dark:text-blue-400 font-medium">
                        @{part}
                    </span>
                );
            }
            return part;
        });
    };

    // Helper to render attachments
    const renderAttachments = (attachmentsJson?: string) => {
        if (!attachmentsJson) return null;
        try {
            const attachments = JSON.parse(attachmentsJson) as string[];
            if (!Array.isArray(attachments) || attachments.length === 0) return null;

            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((url, idx) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        const filename = url.split('/').pop() || 'file';

                        if (isImage) {
                            return (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative group">
                                    <img
                                        src={url}
                                        alt={filename}
                                        className="h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
                                    />
                                </a>
                            );
                        }

                        return (
                            <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <PaperClipIcon className="h-4 w-4 text-gray-500" />
                                <span className="text-xs text-blue-600 dark:text-blue-400 underline truncate max-w-[150px]">
                                    {filename.replace(/^\d+-/, '')}
                                </span>
                            </a>
                        );
                    })}
                </div>
            );
        } catch (e) {
            console.error('Error parsing attachments:', e);
            return null;
        }
    };

    // Helper to render message content with highlighted mentions and clickable ticket IDs
    const renderMessageContent = (content: string) => {
        // First, split by ticket references (#TKT-xxx or just #xxx)
        const ticketRegex = /(#(?:TKT-)?[\w-]+)/gi;
        const segments = content.split(ticketRegex);

        return segments.map((segment, index) => {
            // Check if this segment is a ticket reference
            if (ticketRegex.test(segment)) {
                // Reset the regex lastIndex after test
                ticketRegex.lastIndex = 0;
                const ticketNumber = segment.replace('#', '');
                return (
                    <a
                        key={`ticket-${index}`}
                        href={`/tickets?search=${encodeURIComponent(ticketNumber)}`}
                        className="text-orange-600 dark:text-orange-400 font-medium hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {segment}
                    </a>
                );
            }
            // Otherwise, render with mention detection
            return <span key={`segment-${index}`}>{renderMentions(segment, `seg-${index}`)}</span>;
        });
    };

    const fetchMessages = useCallback(async () => {
        try {
            const response = await fetch(`/api/chats/${chatId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
                setHasMore(data.hasMore || false);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    }, [chatId]);

    const fetchChatDetails = useCallback(async () => {
        try {
            const response = await fetch(`/api/chats/${chatId}`);
            if (response.status === 404) {
                // Chat was deleted - close the window
                onClose();
                return;
            }
            if (response.ok) {
                const data = await response.json();
                const chat = data.chat;
                if (chat.isTicketChat && chat.ticket) {
                    setChatName(`#${chat.ticket.ticketNumber}`);
                    setTicketInfo({
                        id: chat.ticketId,
                        ticketNumber: chat.ticket.ticketNumber,
                        deviceBrand: chat.ticket.deviceBrand,
                        deviceModel: chat.ticket.deviceModel,
                    });
                } else if (chat.name) {
                    setChatName(chat.name);
                }
                setChatStatus(chat.status || 'OPEN');
            }
        } catch (error) {
            console.error('Error fetching chat details:', error);
        }
    }, [chatId, onClose]);

    const markAsRead = useCallback(async () => {
        try {
            await fetch(`/api/chats/${chatId}/read`, { method: 'POST' });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }, [chatId]);

    useEffect(() => {
        fetchChatDetails();
        fetchMessages();
        markAsRead();

        // Poll for new messages and status changes every 2 seconds
        const interval = setInterval(() => {
            fetchMessages();
            fetchChatDetails(); // Also check for status/deletion
        }, 2000);

        return () => clearInterval(interval);
    }, [fetchChatDetails, fetchMessages, markAsRead]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Send message handler for MentionInput
    const handleSendMessage = useCallback(async (content: string, attachments?: string[]) => {
        try {
            if (editingMessage) {
                // Edit existing message
                const response = await fetch(
                    `/api/chats/${chatId}/messages/${editingMessage.id}`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content }),
                    }
                );
                if (response.ok) {
                    setEditingMessage(null);
                    fetchMessages();
                }
            } else {
                // Send new message (optionally as reply)
                const body: { content: string; replyToId?: string; attachments?: string[] } = { content };
                if (replyingTo) {
                    body.replyToId = replyingTo.id;
                }
                if (attachments && attachments.length > 0) {
                    body.attachments = attachments;
                }

                const response = await fetch(`/api/chats/${chatId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    setReplyingTo(null);
                    fetchMessages();
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }, [chatId, fetchMessages, editingMessage, replyingTo]);

    // Toggle reaction on a message
    const handleReaction = async (messageId: string, emoji: string) => {
        try {
            await fetch(`/api/chats/${chatId}/messages/${messageId}/reactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emoji }),
            });
            fetchMessages();
        } catch (error) {
            console.error('Error toggling reaction:', error);
        }
    };

    // Delete a message
    const handleDeleteMessage = async (messageId: string) => {
        try {
            const response = await fetch(
                `/api/chats/${chatId}/messages/${messageId}`,
                { method: 'DELETE' }
            );
            if (response.ok) {
                fetchMessages();
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
        setActiveMessageMenu(null);
    };

    // Group reactions by emoji
    const groupReactions = (reactions: Reaction[] = []) => {
        const grouped: Record<string, { count: number; userReacted: boolean }> = {};
        reactions.forEach((r) => {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = { count: 0, userReacted: false };
            }
            grouped[r.emoji].count++;
            if (r.userId === session?.user?.id) {
                grouped[r.emoji].userReacted = true;
            }
        });
        return grouped;
    };

    // Delete chat
    const handleDeleteChat = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
            if (response.ok) {
                onClose();
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Toggle chat status (close/reopen)
    const handleToggleStatus = async () => {
        const newStatus = chatStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
        try {
            const response = await fetch(`/api/chats/${chatId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                setChatStatus(newStatus);
                setShowMenu(false);
            }
        } catch (error) {
            console.error('Error updating chat status:', error);
        }
    };

    function formatMessageTime(dateString: string) {
        const date = new Date(dateString);
        if (isToday(date)) return format(date, 'HH:mm');
        if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
        return format(date, 'MMM d, HH:mm');
    }

    function groupMessagesByDate(messages: Message[]) {
        const groups: { date: string; messages: Message[] }[] = [];
        let currentDate = '';

        messages.forEach((message) => {
            const messageDate = format(new Date(message.createdAt), 'yyyy-MM-dd');
            if (messageDate !== currentDate) {
                currentDate = messageDate;
                groups.push({ date: messageDate, messages: [message] });
            } else {
                groups[groups.length - 1].messages.push(message);
            }
        });

        return groups;
    }

    function formatDateHeader(dateString: string) {
        const date = new Date(dateString);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'EEEE, MMMM d');
    }

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={onBack}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    aria-label="Back"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {chatName}
                        </h2>
                        {chatStatus === 'CLOSED' && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                {t('chat.closed')}
                            </span>
                        )}
                    </div>
                    {ticketInfo && (
                        <Link
                            href={`/tickets/${ticketInfo.id}`}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <TicketIcon className="h-3 w-3" />
                            {ticketInfo.deviceBrand} {ticketInfo.deviceModel}
                        </Link>
                    )}
                </div>

                {/* Menu dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        aria-label="Menu"
                    >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                            <button
                                onClick={handleToggleStatus}
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {chatStatus === 'OPEN' ? (
                                    <>
                                        <LockClosedIcon className="h-4 w-4 text-gray-500" />
                                        {t('chat.closeChat')}
                                    </>
                                ) : (
                                    <>
                                        <LockOpenIcon className="h-4 w-4 text-green-500" />
                                        {t('chat.reopenChat')}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowMenu(false);
                                    setShowDeleteConfirm(true);
                                }}
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                            >
                                <TrashIcon className="h-4 w-4" />
                                {t('chat.deleteChat')}
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    aria-label="Close"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p className="text-sm">{t('chat.noMessages')}</p>
                        <p className="text-xs mt-1">{t('chat.startConversation')}</p>
                    </div>
                ) : (
                    messageGroups.map((group) => (
                        <div key={group.date}>
                            {/* Date header */}
                            <div className="flex items-center justify-center my-4">
                                <span className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
                                    {formatDateHeader(group.date)}
                                </span>
                            </div>
                            {/* Messages */}
                            <div className="space-y-3">
                                {group.messages.map((message) => {
                                    const isOwn = message.sender.id === session?.user?.id;
                                    const reactions = groupReactions(message.reactions);

                                    return (
                                        <div
                                            key={message.id}
                                            className="group flex items-start gap-2 relative"
                                            onMouseLeave={() => setActiveMessageMenu(null)}
                                        >
                                            <div className="flex-shrink-0">
                                                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {/* Reply preview */}
                                                {message.replyTo && (
                                                    <div className="mb-1 pl-2 border-l-2 border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="font-medium">{message.replyTo.sender.name || message.replyTo.sender.username}</span>
                                                        <p className="truncate">{message.replyTo.content}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                        {message.sender.name || message.sender.username}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatMessageTime(message.createdAt)}
                                                    </span>
                                                    {message.isEdited && (
                                                        <span className="text-xs text-gray-400 italic">({t('chat.edited')})</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                                    {renderMessageContent(message.content)}
                                                </p>
                                                {renderAttachments(message.attachments)}

                                                {/* Reactions display */}
                                                {Object.keys(reactions).length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {Object.entries(reactions).map(([emoji, data]) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleReaction(message.id, emoji)}
                                                                className={`px-1.5 py-0.5 text-xs rounded-full border transition-colors ${data.userReacted
                                                                    ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
                                                                    : 'bg-gray-100 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                    }`}
                                                            >
                                                                {emoji} {data.count}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Hover actions */}
                                            {chatStatus === 'OPEN' && (
                                                <div className="absolute right-0 top-0 hidden group-hover:flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-0.5">
                                                    {/* Emoji reactions */}
                                                    {EMOJI_OPTIONS.slice(0, 3).map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(message.id, emoji)}
                                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                                                            title={`React with ${emoji}`}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                    {/* Reply */}
                                                    <button
                                                        onClick={() => setReplyingTo(message)}
                                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                        title="Reply"
                                                    >
                                                        <ChatBubbleOvalLeftIcon className="h-4 w-4 text-gray-500" />
                                                    </button>
                                                    {/* Edit/Delete for own messages */}
                                                    {isOwn && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingMessage(message);
                                                                    setActiveMessageMenu(null);
                                                                }}
                                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon className="h-4 w-4 text-gray-500" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMessage(message.id)}
                                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="h-4 w-4 text-red-500" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message composer */}
            <div className="border-t border-gray-200 dark:border-gray-700">
                {/* Reply/Edit preview bar */}
                {(replyingTo || editingMessage) && (
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                        <div className="flex-1 min-w-0">
                            {replyingTo && (
                                <div className="text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">{t('chat.replyingTo')} </span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {replyingTo.sender.name || replyingTo.sender.username}
                                    </span>
                                    <p className="text-gray-500 dark:text-gray-400 truncate">{replyingTo.content}</p>
                                </div>
                            )}
                            {editingMessage && (
                                <div className="text-xs">
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">{t('chat.editingMessage')}</span>
                                    <p className="text-gray-500 dark:text-gray-400 truncate">{editingMessage.content}</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setReplyingTo(null);
                                setEditingMessage(null);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                        </button>
                    </div>
                )}

                <div className="px-4 py-3">
                    {chatStatus === 'CLOSED' ? (
                        <div className="flex items-center justify-center gap-2 py-2 text-gray-500 dark:text-gray-400">
                            <LockClosedIcon className="h-4 w-4" />
                            <span className="text-sm">{t('chat.chatClosedMessage')}</span>
                        </div>
                    ) : (
                        <MentionInput
                            onSend={handleSendMessage}
                            disabled={isLoading}
                            placeholder={editingMessage ? t('chat.editPlaceholder') : t('chat.messagePlaceholder')}
                            initialValue={editingMessage?.content}
                            chatId={chatId}
                            key={editingMessage?.id || 'new'} // Reset input when editing different message
                        />
                    )}
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
                    <div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm mx-4 transform transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <TrashIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
                            {t('chat.deleteChat')}
                        </h3>
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
                            {t('chat.deleteChatConfirm')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleDeleteChat}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {t('chat.deleting')}
                                    </>
                                ) : (
                                    t('delete')
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/language-context';

interface User {
    id: string;
    name: string | null;
    username: string;
}

interface MentionInputProps {
    onSend: (content: string, attachments?: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
    initialValue?: string;
    chatId?: string;
}

interface Attachment {
    url: string;
    filename: string;
    type: string;
}

export function MentionInput({ onSend, disabled, placeholder = 'Type a message...', initialValue = '', chatId }: MentionInputProps) {
    const { t } = useLanguage();
    const [value, setValue] = useState(initialValue);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStart, setMentionStart] = useState(-1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Search for users when typing after @
    const searchUsers = useCallback(async (query: string) => {
        if (query.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`);
            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.users || []);
                setShowSuggestions(data.users?.length > 0);
                setSelectedIndex(0);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        }
    }, []);

    // Handle input changes and detect @ mentions
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart || 0;
        setValue(newValue);

        // Check if we're in a mention context
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            // Check if this is a valid mention context (no spaces after @)
            if (!textAfterAt.includes(' ') && textAfterAt.length <= 20) {
                setMentionStart(lastAtIndex);
                setMentionQuery(textAfterAt);
                searchUsers(textAfterAt);
                return;
            }
        }

        // Not in mention context
        setShowSuggestions(false);
        setMentionStart(-1);
        setMentionQuery('');
    }, [searchUsers]);

    // Insert a mention
    const insertMention = useCallback((user: User) => {
        if (mentionStart === -1) return;

        const beforeMention = value.slice(0, mentionStart);
        const afterMention = value.slice(mentionStart + 1 + mentionQuery.length);
        const mention = `@${user.username} `;
        const newValue = beforeMention + mention + afterMention;

        setValue(newValue);
        setShowSuggestions(false);
        setMentionStart(-1);
        setMentionQuery('');

        // Focus and set cursor position
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursorPos = mentionStart + mention.length;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }, [value, mentionStart, mentionQuery]);

    // Handle keyboard navigation in suggestions
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % suggestions.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                    break;
                case 'Enter':
                case 'Tab':
                    e.preventDefault();
                    insertMention(suggestions[selectedIndex]);
                    break;
                case 'Escape':
                    e.preventDefault();
                    setShowSuggestions(false);
                    break;
            }
            return;
        }

        // Send on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [showSuggestions, suggestions, selectedIndex, insertMention]);

    // Handle file selection
    const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !chatId) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`/api/chats/${chatId}/attachments`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setAttachments((prev) => [...prev, {
                    url: data.url,
                    filename: data.filename,
                    type: data.type,
                }]);
            } else {
                const error = await response.json();
                console.error('Upload failed:', error.error);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setIsUploading(false);
            // Reset file input
            e.target.value = '';
        }
    }, [chatId]);

    // Remove attachment
    const removeAttachment = useCallback((index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // Send message
    const handleSend = useCallback(async () => {
        const content = value.trim();
        const attachmentUrls = attachments.map((a) => a.url);

        if (!content && attachmentUrls.length === 0) return;
        if (isSending) return;

        setIsSending(true);
        try {
            await onSend(content, attachmentUrls.length > 0 ? attachmentUrls : undefined);
            setValue('');
            setAttachments([]);
        } finally {
            setIsSending(false);
        }
    }, [value, attachments, isSending, onSend]);

    return (
        <div className="relative">
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
                    {suggestions.map((user, index) => (
                        <button
                            key={user.id}
                            onClick={() => insertMention(user)}
                            className={`w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                }`}
                        >
                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                                {(user.name || user.username).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user.name || user.username}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    @{user.username}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Input area */}
            <div className="flex items-end gap-2">
                {/* Attachment button */}
                {chatId && (
                    <>
                        <input
                            type="file"
                            id="chat-file-input"
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.txt"
                            onChange={handleFileSelect}
                            disabled={disabled || isUploading}
                        />
                        <label
                            htmlFor="chat-file-input"
                            className={`flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUploading ? (
                                <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <PaperClipIcon className="h-5 w-5 text-gray-500" />
                            )}
                        </label>
                    </>
                )}

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || isSending}
                    rows={1}
                    className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    style={{ maxHeight: '100px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={(!value.trim() && attachments.length === 0) || isSending || disabled}
                    className="flex-shrink-0 p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send"
                >
                    {isSending ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="relative group">
                            {att.type.startsWith('image/') ? (
                                <img src={att.url} alt={att.filename} className="h-16 w-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                            ) : (
                                <div className="h-16 px-3 flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{att.filename}</span>
                                </div>
                            )}
                            <button
                                onClick={() => removeAttachment(idx)}
                                className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Helper text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('chat.mentionHint')}
            </p>
        </div>
    );
}

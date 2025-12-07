// Chat module type definitions
// Defines interfaces for chat requests, responses, and shared types

export interface ChatParticipantRole {
    OWNER: 'OWNER';
    ADMIN: 'ADMIN';
    MEMBER: 'MEMBER';
}

export const CHAT_PARTICIPANT_ROLES = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
} as const;

export type ChatParticipantRoleType = typeof CHAT_PARTICIPANT_ROLES[keyof typeof CHAT_PARTICIPANT_ROLES];

// Request types
export interface CreateChatRequest {
    name?: string;
    ticketId?: string;
    participantIds: string[];
}

export interface SendMessageRequest {
    content: string;
}

export interface AddParticipantRequest {
    userId: string;
    role?: ChatParticipantRoleType;
}

// Response types
export interface ChatParticipantResponse {
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    lastReadAt: string;
    user: {
        id: string;
        name: string | null;
        username: string;
        email: string;
    };
}

export interface ChatMessageResponse {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    sender: {
        id: string;
        name: string | null;
        username: string;
    };
}

export interface ChatResponse {
    id: string;
    name: string | null;
    ticketId: string | null;
    isTicketChat: boolean;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string | null;
    participants: ChatParticipantResponse[];
    unreadCount?: number;
    lastMessage?: ChatMessageResponse;
    ticket?: {
        ticketNumber: string;
        deviceBrand: string;
        deviceModel: string;
        status: string;
    };
}

export interface ChatListResponse {
    chats: ChatResponse[];
    totalCount: number;
}

export interface MessageListResponse {
    messages: ChatMessageResponse[];
    hasMore: boolean;
    cursor?: string;
}

export interface UnreadCountResponse {
    totalUnread: number;
    chatUnreadCounts: { chatId: string; count: number }[];
}

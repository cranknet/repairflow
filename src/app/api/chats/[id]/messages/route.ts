import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/chats/[id]/messages - Get paginated messages
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const cursor = searchParams.get('cursor'); // Message ID for pagination

        // Verify user is a participant
        const participant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: id,
                    userId: session.user.id,
                },
            },
        });

        if (!participant) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Build the query
        const where: Record<string, unknown> = {
            chatId: id,
            deletedAt: null,
        };

        // Fetch messages
        const messages = await prisma.chatMessage.findMany({
            where,
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                reactions: {
                    select: {
                        id: true,
                        emoji: true,
                        userId: true,
                    },
                },
                replyTo: {
                    select: {
                        id: true,
                        content: true,
                        sender: {
                            select: { name: true, username: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1, // Fetch one extra to determine if there are more
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1, // Skip the cursor itself
            }),
        });

        const hasMore = messages.length > limit;
        const resultMessages = hasMore ? messages.slice(0, -1) : messages;

        return NextResponse.json({
            messages: resultMessages.reverse(), // Return in chronological order
            hasMore,
            cursor: resultMessages.length > 0 ? resultMessages[0].id : undefined,
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

// POST /api/chats/[id]/messages - Send a message
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify user is a participant
        const participant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: id,
                    userId: session.user.id,
                },
            },
        });

        if (!participant) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Check if chat is closed
        const chat = await prisma.chat.findUnique({
            where: { id },
            select: { status: true },
        });

        if (chat?.status === 'CLOSED') {
            return NextResponse.json(
                { error: 'This chat is closed. Reopen it to send messages.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { content, replyToId, attachments } = body;

        const hasContent = content && typeof content === 'string' && content.trim().length > 0;
        const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

        if (!hasContent && !hasAttachments) {
            return NextResponse.json(
                { error: 'Message content or attachment is required' },
                { status: 400 }
            );
        }

        // Create the message and update chat's lastMessageAt
        const now = new Date();
        const [message] = await prisma.$transaction([
            prisma.chatMessage.create({
                data: {
                    content: content ? content.trim() : '',
                    attachments: hasAttachments ? JSON.stringify(attachments) : '[]',
                    replyToId: replyToId || null,
                    chatId: id,
                    senderId: session.user.id,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },
                },
            }),
            prisma.chat.update({
                where: { id },
                data: { lastMessageAt: now },
            }),
            // Update sender's lastReadAt to now
            prisma.chatParticipant.update({
                where: {
                    chatId_userId: {
                        chatId: id,
                        userId: session.user.id,
                    },
                },
                data: { lastReadAt: now },
            }),
        ]);

        // Parse @mentions and create notifications for mentioned users
        const mentionRegex = /@(\w+)/g;
        const mentions = [...content.matchAll(mentionRegex)].map(m => m[1]);

        if (mentions.length > 0) {
            // Find mentioned users
            const mentionedUsers = await prisma.user.findMany({
                where: {
                    username: { in: mentions },
                    id: { not: session.user.id }, // Don't notify sender
                },
                select: { id: true },
            });

            // Get chat info for notification message
            const chat = await prisma.chat.findUnique({
                where: { id },
                include: {
                    ticket: { select: { id: true, ticketNumber: true } },
                    participants: { select: { userId: true } },
                },
            });

            const senderName = message.sender.name || message.sender.username;
            const ticketRef = chat?.ticket?.ticketNumber ? `#${chat.ticket.ticketNumber}` : 'a ticket chat';

            // Get existing participant IDs
            const existingParticipantIds = new Set(chat?.participants.map(p => p.userId) || []);

            // Add mentioned users as chat participants if not already
            const newParticipants = mentionedUsers.filter(u => !existingParticipantIds.has(u.id));
            console.log('Adding participants:', newParticipants.map(u => u.id));

            for (const user of newParticipants) {
                try {
                    await prisma.chatParticipant.create({
                        data: {
                            chatId: id,
                            userId: user.id,
                            role: 'MEMBER',
                        },
                    });
                    console.log('Added participant:', user.id);
                } catch (error: unknown) {
                    // Only ignore unique constraint violations (P2002)
                    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
                        console.log('Participant already exists:', user.id);
                    } else {
                        console.error('Error adding participant:', user.id, error);
                    }
                }
            }

            // Create notifications for each mentioned user
            if (mentionedUsers.length > 0) {
                await prisma.notification.createMany({
                    data: mentionedUsers.map(user => ({
                        userId: user.id,
                        ticketId: chat?.ticket?.id || null,
                        type: 'CHAT_MENTION',
                        message: `${senderName} mentioned you in ${ticketRef}`,
                    })),
                });
            }

            // Create notifications for OTHER participants (not mentioned, not sender)
            const mentionedUserIds = new Set(mentionedUsers.map(u => u.id));
            const otherParticipants = chat?.participants
                .filter(p => p.userId !== session.user.id && !mentionedUserIds.has(p.userId))
                .map(p => p.userId) || [];

            if (otherParticipants.length > 0) {
                await prisma.notification.createMany({
                    data: otherParticipants.map(userId => ({
                        userId,
                        ticketId: chat?.ticket?.id || null,
                        type: 'CHAT_MESSAGE',
                        message: `${senderName} sent a message in ${ticketRef}`,
                    })),
                });
            }
        } else {
            // No mentions - notify all other participants about new message
            const chat = await prisma.chat.findUnique({
                where: { id },
                include: {
                    ticket: { select: { id: true, ticketNumber: true } },
                    participants: { select: { userId: true } },
                },
            });

            const senderName = message.sender.name || message.sender.username;
            const ticketRef = chat?.ticket?.ticketNumber ? `#${chat.ticket.ticketNumber}` : 'a ticket chat';

            const otherParticipants = chat?.participants
                .filter(p => p.userId !== session.user.id)
                .map(p => p.userId) || [];

            if (otherParticipants.length > 0) {
                await prisma.notification.createMany({
                    data: otherParticipants.map(userId => ({
                        userId,
                        ticketId: chat?.ticket?.id || null,
                        type: 'CHAT_MESSAGE',
                        message: `${senderName} sent a message in ${ticketRef}`,
                    })),
                });
            }
        }

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}

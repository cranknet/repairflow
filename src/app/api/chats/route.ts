import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CHAT_PARTICIPANT_ROLES } from '@/lib/chat/types';

// GET /api/chats - List all chats for the current user
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '20');
        const ticketOnly = searchParams.get('ticketOnly') === 'true';
        const teamOnly = searchParams.get('teamOnly') === 'true';

        // Build where clause
        const where: Record<string, unknown> = {
            participants: {
                some: {
                    userId: session.user.id,
                },
            },
        };

        if (ticketOnly) {
            where.isTicketChat = true;
        } else if (teamOnly) {
            where.isTicketChat = false;
        }

        // Fetch chats with participants and last message
        const chats = await prisma.chat.findMany({
            where,
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                email: true,
                            },
                        },
                    },
                },
                ticket: {
                    select: {
                        ticketNumber: true,
                        deviceBrand: true,
                        deviceModel: true,
                        status: true,
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    where: { deletedAt: null },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { lastMessageAt: { sort: 'desc', nulls: 'last' } },
                { createdAt: 'desc' },
            ],
            take: limit,
        });

        // Calculate unread counts for each chat
        const chatsWithUnread = await Promise.all(
            chats.map(async (chat) => {
                const participant = chat.participants.find(
                    (p) => p.userId === session.user.id
                );

                const unreadCount = participant
                    ? await prisma.chatMessage.count({
                        where: {
                            chatId: chat.id,
                            createdAt: { gt: participant.lastReadAt },
                            senderId: { not: session.user.id },
                            deletedAt: null,
                        },
                    })
                    : 0;

                return {
                    ...chat,
                    unreadCount,
                    lastMessage: chat.messages[0] || null,
                    messages: undefined, // Remove messages array from response
                };
            })
        );

        return NextResponse.json({
            chats: chatsWithUnread,
            totalCount: chatsWithUnread.length,
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chats' },
            { status: 500 }
        );
    }
}

// POST /api/chats - Create a new chat
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, ticketId, participantIds = [] } = body;

        // Validate: must have at least one participant (other than creator)
        if (!ticketId && participantIds.length === 0) {
            return NextResponse.json(
                { error: 'At least one participant is required for team chats' },
                { status: 400 }
            );
        }

        // If ticketId provided, check if chat already exists for this ticket
        if (ticketId) {
            const existingChat = await prisma.chat.findUnique({
                where: { ticketId },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });

            if (existingChat) {
                return NextResponse.json({ chat: existingChat });
            }

            // Verify ticket exists
            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                select: { id: true, assignedToId: true },
            });

            if (!ticket) {
                return NextResponse.json(
                    { error: 'Ticket not found' },
                    { status: 404 }
                );
            }
        }

        // Verify current user exists (necessary for foreign key constraint)
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true },
        });

        if (!currentUser) {
            console.error('Current user not found in database:', session.user.id);
            return NextResponse.json(
                { error: 'User session invalid' },
                { status: 401 }
            );
        }

        // Create the chat
        const chat = await prisma.chat.create({
            data: {
                name: name || null,
                ticketId: ticketId || null,
                isTicketChat: !!ticketId,
                participants: {
                    create: [
                        // Creator is always OWNER
                        {
                            userId: session.user.id,
                            role: CHAT_PARTICIPANT_ROLES.OWNER,
                        },
                        // Add other participants
                        ...participantIds
                            .filter((id: string) => id !== session.user.id)
                            .map((userId: string) => ({
                                userId,
                                role: CHAT_PARTICIPANT_ROLES.MEMBER,
                            })),
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                email: true,
                            },
                        },
                    },
                },
                ticket: {
                    select: {
                        ticketNumber: true,
                        deviceBrand: true,
                        deviceModel: true,
                        status: true,
                    },
                },
            },
        });

        return NextResponse.json({ chat }, { status: 201 });
    } catch (error) {
        console.error('Error creating chat:', error);
        return NextResponse.json(
            { error: 'Failed to create chat' },
            { status: 500 }
        );
    }
}

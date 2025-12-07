import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/chats/[id] - Get chat details
export async function GET(request: NextRequest, { params }: RouteParams) {
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

        const chat = await prisma.chat.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                email: true,
                                role: true,
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
                        customer: {
                            select: {
                                name: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Get unread count
        const unreadCount = await prisma.chatMessage.count({
            where: {
                chatId: id,
                createdAt: { gt: participant.lastReadAt },
                senderId: { not: session.user.id },
                deletedAt: null,
            },
        });

        return NextResponse.json({
            chat: {
                ...chat,
                unreadCount,
            },
        });
    } catch (error) {
        console.error('Error fetching chat:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat' },
            { status: 500 }
        );
    }
}

// DELETE /api/chats/[id] - Delete chat (any participant can delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

        await prisma.chat.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Chat deleted' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        return NextResponse.json(
            { error: 'Failed to delete chat' },
            { status: 500 }
        );
    }
}

// PATCH /api/chats/[id] - Update chat (close/reopen)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

        const body = await request.json();
        const { status } = body;

        // Validate status
        if (status && !['OPEN', 'CLOSED'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be OPEN or CLOSED' },
                { status: 400 }
            );
        }

        const updatedChat = await prisma.chat.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({
            success: true,
            chat: updatedChat,
            message: status === 'CLOSED' ? 'Chat closed' : 'Chat reopened'
        });
    } catch (error) {
        console.error('Error updating chat:', error);
        return NextResponse.json(
            { error: 'Failed to update chat' },
            { status: 500 }
        );
    }
}


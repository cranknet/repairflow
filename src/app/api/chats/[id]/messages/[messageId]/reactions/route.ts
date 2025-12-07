import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string; messageId: string }>;
}

// POST /api/chats/[id]/messages/[messageId]/reactions - Add reaction
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, messageId } = await params;
        const body = await request.json();
        const { emoji } = body;

        if (!emoji || typeof emoji !== 'string') {
            return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
        }

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

        // Verify message exists and belongs to this chat
        const message = await prisma.chatMessage.findFirst({
            where: {
                id: messageId,
                chatId: id,
                deletedAt: null,
            },
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Toggle reaction (add if doesn't exist, remove if exists)
        const existingReaction = await prisma.chatReaction.findFirst({
            where: {
                messageId,
                userId: session.user.id,
                emoji,
            },
        });

        if (existingReaction) {
            // Remove reaction
            await prisma.chatReaction.delete({
                where: { id: existingReaction.id },
            });
            return NextResponse.json({ action: 'removed', emoji });
        } else {
            // Add reaction
            const reaction = await prisma.chatReaction.create({
                data: {
                    messageId,
                    userId: session.user.id,
                    emoji,
                },
            });
            return NextResponse.json({ action: 'added', reaction });
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        return NextResponse.json(
            { error: 'Failed to toggle reaction' },
            { status: 500 }
        );
    }
}

// GET /api/chats/[id]/messages/[messageId]/reactions - Get reactions
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, messageId } = await params;

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

        const reactions = await prisma.chatReaction.findMany({
            where: { messageId },
            include: {
                message: false,
            },
        });

        // Group by emoji with count and user info
        const grouped: Record<string, { count: number; userReacted: boolean }> = {};
        reactions.forEach((r) => {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = { count: 0, userReacted: false };
            }
            grouped[r.emoji].count++;
            if (r.userId === session.user.id) {
                grouped[r.emoji].userReacted = true;
            }
        });

        return NextResponse.json({ reactions: grouped });
    } catch (error) {
        console.error('Error fetching reactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reactions' },
            { status: 500 }
        );
    }
}

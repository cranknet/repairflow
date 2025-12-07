import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string; messageId: string }>;
}

// PATCH /api/chats/[id]/messages/[messageId] - Edit message
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, messageId } = await params;
        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
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

        // Verify message exists and belongs to current user
        const message = await prisma.chatMessage.findFirst({
            where: {
                id: messageId,
                chatId: id,
                senderId: session.user.id, // Can only edit own messages
                deletedAt: null,
            },
        });

        if (!message) {
            return NextResponse.json(
                { error: 'Message not found or you cannot edit it' },
                { status: 404 }
            );
        }

        // Update message
        const updatedMessage = await prisma.chatMessage.update({
            where: { id: messageId },
            data: {
                content: content.trim(),
                isEdited: true,
            },
            include: {
                sender: {
                    select: { id: true, name: true, username: true },
                },
            },
        });

        return NextResponse.json({ message: updatedMessage });
    } catch (error) {
        console.error('Error editing message:', error);
        return NextResponse.json(
            { error: 'Failed to edit message' },
            { status: 500 }
        );
    }
}

// DELETE /api/chats/[id]/messages/[messageId] - Soft delete message
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

        // Verify message exists and belongs to current user
        const message = await prisma.chatMessage.findFirst({
            where: {
                id: messageId,
                chatId: id,
                senderId: session.user.id, // Can only delete own messages
                deletedAt: null,
            },
        });

        if (!message) {
            return NextResponse.json(
                { error: 'Message not found or you cannot delete it' },
                { status: 404 }
            );
        }

        // Soft delete message
        await prisma.chatMessage.update({
            where: { id: messageId },
            data: { deletedAt: new Date() },
        });

        return NextResponse.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json(
            { error: 'Failed to delete message' },
            { status: 500 }
        );
    }
}

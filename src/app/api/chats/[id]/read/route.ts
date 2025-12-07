import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/chats/[id]/read - Mark messages as read
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

        // Update lastReadAt to now
        await prisma.chatParticipant.update({
            where: {
                chatId_userId: {
                    chatId: id,
                    userId: session.user.id,
                },
            },
            data: { lastReadAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark messages as read' },
            { status: 500 }
        );
    }
}

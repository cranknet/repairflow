import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/chats/unread-count - Get total unread message count
export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all chats where user is a participant
        const participations = await prisma.chatParticipant.findMany({
            where: { userId: session.user.id },
            select: {
                chatId: true,
                lastReadAt: true,
            },
        });

        if (participations.length === 0) {
            return NextResponse.json({
                totalUnread: 0,
                chatUnreadCounts: [],
            });
        }

        // Calculate unread count for each chat
        const chatUnreadCounts = await Promise.all(
            participations.map(async (p) => {
                const count = await prisma.chatMessage.count({
                    where: {
                        chatId: p.chatId,
                        createdAt: { gt: p.lastReadAt },
                        senderId: { not: session.user.id },
                        deletedAt: null,
                    },
                });
                return { chatId: p.chatId, count };
            })
        );

        const totalUnread = chatUnreadCounts.reduce((sum, c) => sum + c.count, 0);

        return NextResponse.json({
            totalUnread,
            chatUnreadCounts: chatUnreadCounts.filter((c) => c.count > 0),
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return NextResponse.json(
            { error: 'Failed to fetch unread count' },
            { status: 500 }
        );
    }
}

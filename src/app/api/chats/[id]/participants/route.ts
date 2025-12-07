import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CHAT_PARTICIPANT_ROLES } from '@/lib/chat/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/chats/[id]/participants - List participants
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify user is a participant
        const currentParticipant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: id,
                    userId: session.user.id,
                },
            },
        });

        if (!currentParticipant) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        const participants = await prisma.chatParticipant.findMany({
            where: { chatId: id },
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
            orderBy: { joinedAt: 'asc' },
        });

        return NextResponse.json({ participants });
    } catch (error) {
        console.error('Error fetching participants:', error);
        return NextResponse.json(
            { error: 'Failed to fetch participants' },
            { status: 500 }
        );
    }
}

// POST /api/chats/[id]/participants - Add a participant
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify user is a participant with owner/admin role
        const currentParticipant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: id,
                    userId: session.user.id,
                },
            },
        });

        if (!currentParticipant) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Only OWNER, ADMIN, or system ADMIN can add participants
        const canAddParticipants =
            ['OWNER', 'ADMIN'].includes(currentParticipant.role) ||
            session.user.role === 'ADMIN';

        if (!canAddParticipants) {
            return NextResponse.json(
                { error: 'You do not have permission to add participants' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, role = CHAT_PARTICIPANT_ROLES.MEMBER } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Verify the user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, username: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already a participant
        const existingParticipant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: id,
                    userId,
                },
            },
        });

        if (existingParticipant) {
            return NextResponse.json(
                { error: 'User is already a participant' },
                { status: 400 }
            );
        }

        // Add the participant
        const participant = await prisma.chatParticipant.create({
            data: {
                chatId: id,
                userId,
                role,
            },
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
        });

        return NextResponse.json({ participant }, { status: 201 });
    } catch (error) {
        console.error('Error adding participant:', error);
        return NextResponse.json(
            { error: 'Failed to add participant' },
            { status: 500 }
        );
    }
}

// DELETE /api/chats/[id]/participants?userId=xxx - Remove a participant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const userIdToRemove = searchParams.get('userId');

        if (!userIdToRemove) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Verify current user is a participant
        const currentParticipant = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: id,
                    userId: session.user.id,
                },
            },
        });

        if (!currentParticipant) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Users can remove themselves, or OWNER/ADMIN can remove others
        const isSelf = userIdToRemove === session.user.id;
        const canRemoveOthers =
            ['OWNER', 'ADMIN'].includes(currentParticipant.role) ||
            session.user.role === 'ADMIN';

        if (!isSelf && !canRemoveOthers) {
            return NextResponse.json(
                { error: 'You do not have permission to remove this participant' },
                { status: 403 }
            );
        }

        // Find the participant to remove
        const participantToRemove = await prisma.chatParticipant.findUnique({
            where: {
                chatId_userId: {
                    chatId: id,
                    userId: userIdToRemove,
                },
            },
        });

        if (!participantToRemove) {
            return NextResponse.json(
                { error: 'Participant not found' },
                { status: 404 }
            );
        }

        // Cannot remove the last OWNER unless there's another one
        if (participantToRemove.role === 'OWNER') {
            const ownerCount = await prisma.chatParticipant.count({
                where: {
                    chatId: id,
                    role: 'OWNER',
                },
            });

            if (ownerCount <= 1) {
                return NextResponse.json(
                    { error: 'Cannot remove the only owner of the chat' },
                    { status: 400 }
                );
            }
        }

        await prisma.chatParticipant.delete({
            where: {
                chatId_userId: {
                    chatId: id,
                    userId: userIdToRemove,
                },
            },
        });

        return NextResponse.json({ success: true, message: 'Participant removed' });
    } catch (error) {
        console.error('Error removing participant:', error);
        return NextResponse.json(
            { error: 'Failed to remove participant' },
            { status: 500 }
        );
    }
}

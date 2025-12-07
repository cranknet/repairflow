import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/chats/[id]/attachments - Upload attachment
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
                { error: 'This chat is closed' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'File type not allowed' },
                { status: 400 }
            );
        }

        // Create upload directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat', id);
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const ext = path.extname(file.name);
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `${timestamp}-${randomStr}${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return the public URL
        const url = `/uploads/chat/${id}/${filename}`;

        return NextResponse.json({
            url,
            filename: file.name,
            size: file.size,
            type: file.type,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

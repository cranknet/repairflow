import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/search - Search users for @mention autocomplete
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10);

        if (query.length < 1) {
            return NextResponse.json({ users: [] });
        }

        // Search users by name or username
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { username: { contains: query } },
                ],
                // Exclude current user from results
                id: { not: session.user.id },
            },
            select: {
                id: true,
                name: true,
                username: true,
            },
            take: limit,
            orderBy: [
                { name: 'asc' },
                { username: 'asc' },
            ],
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error searching users:', error);
        return NextResponse.json(
            { error: 'Failed to search users' },
            { status: 500 }
        );
    }
}

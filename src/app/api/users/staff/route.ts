import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all staff and admin users for assignment
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'STAFF'],
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
      orderBy: [
        { role: 'asc' }, // Admins first
        { name: 'asc' },
        { username: 'asc' },
      ],
    });

    // Add caching headers - staff list changes rarely
    return NextResponse.json(users, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching staff users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff users' },
      { status: 500 }
    );
  }
}


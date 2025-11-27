import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view login logs
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const loginLogs = await prisma.loginLog.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to last 100 logs
    });

    return NextResponse.json(loginLogs);
  } catch (error) {
    console.error('Error fetching login logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login logs' },
      { status: 500 }
    );
  }
}


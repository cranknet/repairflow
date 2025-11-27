import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (type) {
      where.type = type;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        ticket: {
          select: {
            ticketNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const deleteAll = searchParams.get('all') === 'true';
    const olderThan = searchParams.get('olderThan'); // Days

    if (deleteAll) {
      // Delete all notifications for the user
      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
        },
      });

      return NextResponse.json({ success: true, message: 'All notifications deleted' });
    }

    if (olderThan) {
      // Delete notifications older than specified days
      const days = parseInt(olderThan);
      if (isNaN(days) || days < 0) {
        return NextResponse.json(
          { error: 'Invalid olderThan parameter' },
          { status: 400 }
        );
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      await prisma.notification.deleteMany({
        where: {
          userId: session.user.id,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: `Notifications older than ${days} days deleted` 
      });
    }

    // Delete only read notifications
    await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
        read: true,
      },
    });

    return NextResponse.json({ success: true, message: 'Read notifications deleted' });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}


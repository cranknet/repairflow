import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'Preferences must be an array' },
        { status: 400 }
      );
    }

    // Upsert all preferences using transaction
    await prisma.$transaction(
      preferences.map((pref: { entityType: string; action: string; enabled: boolean }) =>
        prisma.notificationPreference.upsert({
          where: {
            userId_entityType_action: {
              userId: session.user.id,
              entityType: pref.entityType,
              action: pref.action,
            },
          },
          update: {
            enabled: pref.enabled,
          },
          create: {
            userId: session.user.id,
            entityType: pref.entityType,
            action: pref.action,
            enabled: pref.enabled,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}


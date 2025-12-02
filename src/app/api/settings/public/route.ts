import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['company_name', 'company_logo', 'company_favicon', 'company_phone', 'login_background_image', 'login_background_image_url', 'language', 'currency', 'facebook_url', 'youtube_url', 'instagram_url', 'auto_mark_tickets_as_paid', 'UNSPLASH_ENABLED', 'default_track_image', 'unsplash_random_enabled', 'unsplash_default_goal', 'unsplash_goals'],
        },
      },
    });

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public settings that can be accessed without authentication
const PUBLIC_SETTINGS_KEYS = [
  // Company branding
  'company_name',
  'company_logo',
  'company_favicon',
  'company_phone',
  'company_email',
  'company_address',
  // Login page
  'login_background_image',
  'login_background_image_url',
  'default_login_image',
  // Language/locale
  'language',
  // Finance (for display formatting)
  'currency',
  'currency_symbol',
  'currency_code',
  'currency_position',
  'tax_enabled',
  'tax_rate',
  'tax_label',
  'tax_included',
  // Social links
  'facebook_url',
  'youtube_url',
  'instagram_url',
  'twitter_url',
  'linkedin_url',
  // Ticket creation defaults
  'auto_mark_tickets_as_paid',
  'default_priority',
  'ticket_number_prefix',
  'default_warranty_days',
  // Tracking page
  'default_track_image',
  'tracking_welcome_message',
  'tracking_completion_message',
  // Print settings
  'print_label_size',
  'invoice_prefix',
  'show_logo_on_invoice',
];

export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: PUBLIC_SETTINGS_KEYS,
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


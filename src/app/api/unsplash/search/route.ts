import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    full: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  description: string | null;
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export async function GET(request: NextRequest) {
  try {
    // Check if Unsplash is enabled
    const unsplashEnabled = await prisma.settings.findUnique({
      where: { key: 'UNSPLASH_ENABLED' },
    });

    if (!unsplashEnabled || unsplashEnabled.value !== 'true') {
      return NextResponse.json({
        ok: false,
        reason: 'unsplash_disabled',
      });
    }

    // Get API key from settings
    const apiKeySetting = await prisma.settings.findUnique({
      where: { key: 'UNSPLASH_ACCESS_KEY' },
    });

    // Also check environment variable as fallback
    const apiKey = apiKeySetting?.value || process.env.UNSPLASH_ACCESS_KEY;

    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        reason: 'api_key_missing',
      });
    }

    // Get search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || 'technology repair';

    // Call Unsplash API
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`;
    
    const response = await fetch(unsplashUrl, {
      headers: {
        'Authorization': `Client-ID ${apiKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 403) {
        return NextResponse.json({
          ok: false,
          reason: 'rate_limit_exceeded',
        });
      }

      // Handle other errors
      if (response.status === 401) {
        return NextResponse.json({
          ok: false,
          reason: 'invalid_api_key',
        });
      }

      return NextResponse.json({
        ok: false,
        reason: 'unsplash_error',
        status: response.status,
      });
    }

    const data: UnsplashSearchResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        ok: false,
        reason: 'no_results',
      });
    }

    // Return first result with simplified structure
    const photo = data.results[0];
    return NextResponse.json({
      ok: true,
      data: {
        url: photo.urls.regular,
        fullUrl: photo.urls.full,
        photographer: {
          name: photo.user.name,
          username: photo.user.username,
          profileUrl: photo.user.links.html,
        },
        description: photo.description,
      },
    });
  } catch (error) {
    console.error('Unsplash API error:', error);
    return NextResponse.json({
      ok: false,
      reason: 'unsplash_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}


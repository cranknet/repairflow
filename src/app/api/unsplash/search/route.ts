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

// Goal-based keyword map aligned with RepairFlow goals
const GOAL_KEYWORDS: Record<string, string[]> = {
  repairflow_default: [
    'phone repair workshop',
    'laptop repair tools',
    'electronics repair bench',
    'technician fixing smartphone',
    'repair shop counter customer',
    'electronics service center',
    'phone repair technician',
    'electronics repair tools',
    'customer service tech support',
    'electronic device diagnostics',
  ],
};

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

    // Get search query or goal from URL params
    const searchParams = request.nextUrl.searchParams;
    const goal = searchParams.get('goal');
    const queryParam = searchParams.get('query');

    let query: string;
    let randomPage = 1;

    // If goal is provided, use goal-based random selection
    if (goal) {
      // Get keywords from settings first, then fallback to GOAL_KEYWORDS map
      const unsplashGoalsSetting = await prisma.settings.findUnique({
        where: { key: 'unsplash_goals' },
      });

      let keywords: string[] = [];

      // Parse keywords from settings if available
      if (unsplashGoalsSetting?.value) {
        keywords = unsplashGoalsSetting.value
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      }

      // Fallback to GOAL_KEYWORDS map if no settings keywords
      if (keywords.length === 0 && GOAL_KEYWORDS[goal]) {
        keywords = GOAL_KEYWORDS[goal];
      }

      // Final fallback to default keywords
      if (keywords.length === 0) {
        keywords = GOAL_KEYWORDS.repairflow_default || ['technology repair'];
      }

      // Pick a random keyword
      query = keywords[Math.floor(Math.random() * keywords.length)];

      // Pick a random page between 1 and 5 for variety
      randomPage = Math.floor(Math.random() * 5) + 1;
    } else if (queryParam) {
      // Use explicit query parameter if provided
      query = queryParam;
    } else {
      // Default fallback
      query = 'technology repair';
    }

    // Call Unsplash API with random page for goal-based searches
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape&page=${randomPage}&order_by=latest`;
    
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

    // Randomly pick one result from the returned list for variety
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const photo = data.results[randomIndex];
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




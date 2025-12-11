import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RateLimiter } from "@/lib/rate-limit";

// Global API rate limiter: 300 requests per minute per IP
const globalLimiter = new RateLimiter(60 * 1000, 300);

export default auth(async (req) => {
    const path = req.nextUrl.pathname;
    const session = req.auth;

    // 1. API Rate Limiting
    if (path.startsWith('/api')) {
        // Skip internal/health endpoints and auth endpoints
        if (
            path.startsWith('/api/health') ||
            path.startsWith('/api/live') ||
            path.startsWith('/api/ready') ||
            path.startsWith('/api/auth')
        ) {
            // Continue
        } else {
            const clientId = globalLimiter.getClientId(req);
            const result = globalLimiter.check(clientId);

            if (!result.allowed) {
                return new NextResponse(
                    JSON.stringify({
                        error: 'Too Many Requests',
                        message: 'Please try again later.'
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-RateLimit-Limit': '300',
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': result.resetAt?.toString() || Date.now().toString(),
                        },
                    }
                );
            }
        }
    }

    // 2. Page Authentication & Routing Logic
    // Prepare headers to pass pathname to layout
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", path);

    // Allow access to public routes
    if (
        path.startsWith('/track') ||
        path.startsWith('/login') ||
        path.startsWith('/forgot-password') ||
        path.startsWith('/reset-password') ||
        path.startsWith('/api/auth') ||
        path.startsWith('/install') || // Allow install page to be accessed without auth
        path.startsWith('/complete') // Allow completion page after install
    ) {
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    // Require authentication for protected routes
    if (!session) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Admin-only routes
    if (path.startsWith('/settings') && session.user?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Pass through for authenticated routes
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

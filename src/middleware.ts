import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth(async (req) => {
    const path = req.nextUrl.pathname;
    const session = req.auth;

    // Prepare headers to pass pathname to layout
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", path);

    // Allow access to public routes
    if (
        path.startsWith('/track') ||
        path.startsWith('/login') ||
        path.startsWith('/api/auth') ||
        path.startsWith('/install') // Allow install page to be accessed without auth
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
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

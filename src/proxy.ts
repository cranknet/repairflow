import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth(async (req) => {
  const path = req.nextUrl.pathname;
  const session = req.auth;

  // Allow access to public routes
  if (
    path.startsWith('/track') ||
    path.startsWith('/login') ||
    path.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Require authentication for protected routes
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin-only routes
  if (path.startsWith('/settings') && session.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


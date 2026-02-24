import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard'];

// Paths only for unauthenticated users
const authPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Edge Runtime does not support `jsonwebtoken` (Node.js-only).
  // We check cookie presence here as a first-pass guard.
  // Full JWT validation happens in the dashboard Server Component layout
  // (app/(dashboard)/layout.tsx) which runs in the Node.js runtime.
  const hasToken = request.cookies.has('auth-token');

  // 1. Protect dashboard routes — redirect to login when no cookie
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!hasToken) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // 2. Redirect authenticated users away from login / register
  if (authPaths.some(path => pathname.startsWith(path))) {
    if (hasToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};

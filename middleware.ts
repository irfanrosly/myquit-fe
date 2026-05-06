import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isProtectedRoute, isAuthRoute } from '@/lib/utils/routes';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const hasToken = Boolean(accessToken);

  // Logged-in user visiting auth pages → redirect dashboard
  if (isAuthRoute(pathname) && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protected route without token → redirect login
  if (isProtectedRoute(pathname) && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
};

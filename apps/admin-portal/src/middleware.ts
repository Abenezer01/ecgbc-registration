import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isPublicPath = path === '/login' || path === '/forgot-password';

  // Extract token from cookies
  const token = request.cookies.get('token')?.value || '';

  // Redirect to dashboard if trying to access login while authenticated
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  // Redirect to login if trying to access secure routes without token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Redirect root to dashboard
  if (path === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

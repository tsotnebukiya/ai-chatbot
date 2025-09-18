import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/lib/auth/auth';
import type { Session } from '@/lib/auth/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (['/login', '/register'].includes(pathname)) {
    return NextResponse.next();
  }

  let session: Session | null = null;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
      query: { disableRefresh: true },
    });
  } catch (error) {
    console.error('Failed to resolve session in middleware', error);
  }

  if (!session?.user) {
    const loginUrl = new URL('/login', request.url);
    const redirectPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('redirectUrl', redirectPath);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

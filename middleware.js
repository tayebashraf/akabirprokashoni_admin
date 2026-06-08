import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // 1. Block /tawhid routes on the main production storefront domains
  if (host.includes('www.akabirprokashoni.com') || host === 'akabirprokashoni.com') {
    if (pathname.startsWith('/tawhid')) {
      // Return 404 for any admin pages on the main domain
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // 2. Automatically redirect "/" to "/tawhid" when accessing via a dedicated admin subdomain or host
  // This blocks the storefront home page from displaying on the admin subdomain and routes directly to login/dashboard
  const isAdminSubdomain = host.includes('admin') || host.includes('control') || host.includes('manager');
  
  if (isAdminSubdomain && !host.includes('www.akabirprokashoni.com')) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/tawhid', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/tawhid/:path*',
  ],
};

import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy (formerly middleware) runs on the Edge runtime, which cannot reach Postgres — so this
 * only does the cheap check: is there a session cookie at all? Anyone without
 * one is bounced to the sign-in page before a server render is wasted on them.
 *
 * The authoritative check (is the session valid, unrevoked, and does the role
 * permit this?) happens in the admin layout and in every action, where the
 * database is available. This is a fast path, never a security boundary.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const headers = new Headers(request.headers);
  headers.set('x-pathname', pathname);

  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isDelegateArea = pathname.startsWith('/dashboard');

  if (isAdminArea && !request.cookies.has('lumen_staff')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isDelegateArea && !request.cookies.has('lumen_delegate')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/committees/:path*'],
};

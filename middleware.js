import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('authToken')?.value;
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/';
  const isAdminPage = pathname.startsWith('/admin');
  const isKasirPage = pathname.startsWith('/kasir');

  if (!token && (isAdminPage || isKasirPage)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token && isLoginPage) {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'kasir') return NextResponse.redirect(new URL('/kasir', request.url));
  }

  if (token && role === 'kasir' && isAdminPage) {
    return NextResponse.redirect(new URL('/kasir', request.url));
  }

  if (token && role === 'admin' && isKasirPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/kasir/:path*'],
};
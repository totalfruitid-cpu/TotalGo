import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  const role = req.cookies.get('userRole')?.value
  const { pathname } = req.nextUrl

  // Belum login → lempar ke /login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Proteksi ADMIN
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // Proteksi KASIR
  if (pathname.startsWith('/kasir') && role !== 'kasir') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/kasir/:path*'],
}
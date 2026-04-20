import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const { pathname } = req.nextUrl

  // ❌ belum login
  if (!token) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/kasir')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  // ✔ sudah login → lanjut
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/kasir/:path*']
}
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import admin from './lib/firebaseAdmin' // sesuaikan path

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value
  const { pathname } = req.nextUrl

  // 1. belum login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    // 2. VERIFY TOKEN (INI YANG WAJIB ADA)
    const decoded = await admin.auth().verifyIdToken(token)
    const uid = decoded.uid

    // 3. ambil role asli dari Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = userDoc.data()?.role || 'user'

    // 4. PROTECTION RULES

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (pathname.startsWith('/kasir') && role !== 'kasir' && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // 5. login page redirect kalau sudah login
    if (pathname.startsWith('/login')) {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }

      if (role === 'kasir') {
        return NextResponse.redirect(new URL('/kasir', req.url))
      }

      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()

  } catch (err) {
    console.error('Middleware auth error:', err)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/kasir/:path*', '/login']
}
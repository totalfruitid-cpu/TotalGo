import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import admin from '../../../lib/firebaseAdmin'

export async function POST(req) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 })
    }

    const cookieStore = cookies()

    // 🔥 buang cookie session lama (biar role gak nyangkut)
    cookieStore.delete('session')

    // ✅ verifikasi ID token dari Firebase client
    const decodedToken = await admin.auth().verifyIdToken(token)

    // ✅ bikin session cookie (server-side session)
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 hari
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(token, { expiresIn })

    // ✅ set cookie yang akan dibaca middleware & checkRole
    cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: true,
      path: '/',
      maxAge: expiresIn / 1000,
      sameSite: 'lax',
    })

    return NextResponse.json({
      status: 'ok',
      uid: decodedToken.uid,
    })
  } catch (err) {
    console.error('LOGIN API ERROR:', err)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
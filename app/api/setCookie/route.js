import { NextResponse } from 'next/server'
import admin from '../../../lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: 'No token' }, { status: 400 })
    }

    // verify token
    const decoded = await admin.auth().verifyIdToken(idToken)
    const uid = decoded.uid

    // ambil role dari firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const role = userDoc.data()?.role || 'user'

    const res = NextResponse.json({ success: true, role })

    // 🔥 COOKIE UTAMA (WAJIB INI DOANG)
    res.cookies.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })

    return res

  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
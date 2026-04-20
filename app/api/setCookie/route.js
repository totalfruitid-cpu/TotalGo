export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import admin from '../../../lib/firebaseAdmin'

export async function POST(request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: 'No token' }, { status: 400 })
    }

    // verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken)
    const uid = decoded.uid

    // ambil role dari Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const role = userDoc.data()?.role || "user"

    // 🔥 CREATE RESPONSE (INI YANG BENAR)
    const res = NextResponse.json({ success: true, role })

    // ❗ hanya 1 cookie yang penting
    res.cookies.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })

    // OPTIONAL: kalau mau role cookie, jangan jadi sumber utama
    res.cookies.set('role_hint', role, {
      httpOnly: false, // boleh dibaca client kalau mau UI
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
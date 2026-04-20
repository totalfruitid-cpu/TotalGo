export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import admin from '../../../lib/firebaseAdmin'

export async function POST(request) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 400 })
    }

    const cookieStore = cookies()

    // hapus session lama
    cookieStore.delete('session')

    // verifikasi token
    const decodedToken = await admin.auth().verifyIdToken(token)
    const uid = decodedToken.uid

    // cek role dari firestore (tetap dipakai)
    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const role = userDoc.data().role
    if (!role) {
      return NextResponse.json({ error: 'Role not assigned' }, { status: 403 })
    }

    // bikin SESSION COOKIE (ini yang dibaca middleware & checkRole)
    const expiresIn = 60 * 60 * 24 * 5 * 1000
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(token, { expiresIn })

    cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: true,
      path: '/',
      maxAge: expiresIn / 1000,
      sameSite: 'lax',
    })

    return NextResponse.json({ success: true, role })
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
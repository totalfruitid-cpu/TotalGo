export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import admin from '../../../lib/firebaseAdmin'

export async function POST(request) {
  try {
    const { idToken } = await request.json()
    if (!idToken) {
      return NextResponse.json({ error: 'No token' }, { status: 400 })
    }

    // Verifikasi token
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const uid = decodedToken.uid

    // Ambil role dari Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const role = userDoc.data().role
    if (!role) {
      return NextResponse.json({ error: 'Role not assigned' }, { status: 403 })
    }

    const cookieStore = cookies()

    // Hapus cookie lama
    cookieStore.delete('authToken')
    cookieStore.delete('userRole')

    // Set cookie authToken buat middleware
    cookieStore.set('authToken', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      sameSite: 'lax',
    })

    // Set cookie userRole buat middleware
    cookieStore.set('userRole', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })

    return NextResponse.json({ success: true, role })
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
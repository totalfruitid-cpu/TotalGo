export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import admin from '../../../lib/firebaseAdmin'

export async function POST(request) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 400 })
    }

    const decodedToken = await admin.auth().verifyIdToken(token)
    const uid = decodedToken.uid

    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const role = userDoc.data().role
    if (!role) {
      return NextResponse.json({ error: 'Role not assigned' }, { status: 403 })
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set('authToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 5,
      path: '/',
    })

    response.cookies.set('userRole', role, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 5,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('SetCookie Error:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
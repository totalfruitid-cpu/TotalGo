import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import admin from '../../../lib/firebaseAdmin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = cookies().get('session')?.value

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // verifikasi session cookie
    const decoded = await admin.auth().verifySessionCookie(session, true)
    const uid = decoded.uid

    // ambil role asli dari firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const role = userDoc.data().role

    return NextResponse.json({ role })
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
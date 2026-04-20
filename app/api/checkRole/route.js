import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import admin from '../../../lib/firebaseAdmin'; // <-- UDAH GUE BENERIN

export const runtime = 'nodejs'; // WAJIB: jangan jalan di edge

export async function GET() {
  try {
    const token = cookies().get('authToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    const snap = await admin
      .firestore()
      .doc(`users/${decoded.uid}`)
      .get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'No role doc' }, { status: 403 });
    }

    const role = snap.data().role;

    return NextResponse.json({ role });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import admin from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { token } = await request.json(); // CUMA AMBIL TOKEN, GAK AMBIL ROLE
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 400 });
    }

    // 1. Verifikasi token beneran dari Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Ambil role dari Firestore pake firebase-admin. Ini sumber kebenaran.
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const role = userDoc.data().role;
    if (!role) {
      return NextResponse.json({ error: 'Role not assigned' }, { status: 403 });
    }

    // 3. Baru set cookie. Role yang diset udah pasti dari server, bukan dari client.
    cookies().set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 5, // 5 hari
      path: '/',
    });
    
    cookies().set('userRole', role, { // <-- ROLE DARI SERVER
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 5,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('SetCookie Error:', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
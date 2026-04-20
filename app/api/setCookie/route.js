import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import admin from '../../../lib/firebaseAdmin'; // <-- UDAH GUE BENERIN

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 400 });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const role = userDoc.data().role;
    if (!role) {
      return NextResponse.json({ error: 'Role not assigned' }, { status: 403 });
    }

    cookies().set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 5,
      path: '/',
    });
    
    cookies().set('userRole', role, {
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
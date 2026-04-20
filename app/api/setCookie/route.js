import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // Verifikasi token beneran dari Firebase, bukan token editan
    await admin.auth().verifyIdToken(token);

    const response = NextResponse.json({ success: true });
    
    // Ini kuncinya: httpOnly biar gak bisa diedit dari DevTools
    response.cookies.set('authToken', token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 5, // 5 hari
    });

    return response;
  } catch (err) {
    console.error('SetCookie Error:', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

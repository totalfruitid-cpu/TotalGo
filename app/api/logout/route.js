import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = cookies()

  // 🔥 ini yang dipakai middleware & checkRole
  cookieStore.delete('session')

  return NextResponse.json({ success: true })
}
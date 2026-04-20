import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import admin from "../../../lib/firebaseAdmin"

export const runtime = "nodejs"
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const token = cookies().get("session")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await admin.auth().verifyIdToken(token)
    const uid = decoded.uid

    const doc = await admin.firestore().collection("users").doc(uid).get()

    if (!doc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const role = doc.data()?.role || "user"

    const allowed = ["admin", "kasir", "user"]

    if (!allowed.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }

    return NextResponse.json({ role })

  } catch (err) {
    console.error("checkRole error:", err)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
import admin from "../../../lib/firebaseAdmin"

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" })
    }

    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: "No token" })
    }

    // verify firebase token
    const decoded = await admin.auth().verifyIdToken(idToken)
    const uid = decoded.uid

    // ambil role user
    const userDoc = await admin.firestore().collection("users").doc(uid).get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" })
    }

    const role = userDoc.data()?.role || "user"

    // 🔥 CREATE SESSION COOKIE (AMAN & STABIL)
    const expiresIn = 60 * 60 * 24 * 7 * 1000 // 7 hari

    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn })

    // 🔥 SET COOKIE
    res.setHeader(
      "Set-Cookie",
      `session=${sessionCookie}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
    )

    return res.status(200).json({
      success: true,
      role
    })

  } catch (err) {
    console.error("SETCOOKIE ERROR:", err)
    return res.status(401).json({ error: "Invalid token" })
  }
}
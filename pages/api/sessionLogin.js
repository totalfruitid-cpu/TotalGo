import admin from "../../lib/firebaseAdmin"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { idToken } = req.body
    if (!idToken) {
      return res.status(400).json({ error: "No token provided" })
    }

    // 🔥 verify token + revoke check
    const decoded = await admin.auth().verifyIdToken(idToken, true)
    
    // 🔥 AMBIL ROLE LANGSUNG DARI TOKEN - BUKAN FIRESTORE
    const role = decoded.role
    
    if (!role) {
      return res.status(403).json({ error: "Role tidak ditemukan di token" })
    }

    // 🔥 create session cookie
    const expiresIn = 60 * 60 * 24 * 14 * 1000 // 14 hari
    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn,
    })

    // 🔥 cookie config secure
    const isProd = process.env.NODE_ENV === "production"
    const cookie = [
      `session=${sessionCookie}`,
      "Path=/",
      "HttpOnly",
      `Max-Age=${60 * 60 * 24 * 14}`,
      "SameSite=Lax",
      isProd ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ")

    res.setHeader("Set-Cookie", cookie)

    // 🔥 atomic response
    return res.status(200).json({
      success: true,
      role, // role dari token
    })
  } catch (err) {
    console.error("SESSION LOGIN ERROR:", err)
    return res.status(401).json({ error: "Unauthorized" })
  }
}
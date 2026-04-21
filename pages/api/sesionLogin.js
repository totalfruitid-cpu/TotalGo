import admin from "../../lib/firebaseAdmin"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: "No token" })
    }

    const expiresIn = 60 * 60 * 24 * 14 * 1000 // 14 hari

    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn })

    res.setHeader(
      "Set-Cookie",
      `session=${sessionCookie}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 14}; SameSite=Lax`
    )

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error("SESSION LOGIN ERROR:", err)
    return res.status(401).json({ error: "Unauthorized" })
  }
}
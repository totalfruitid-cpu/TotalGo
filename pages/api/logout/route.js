export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" })
    }

    // 🔥 HAPUS COOKIE SESSION
    res.setHeader(
      "Set-Cookie",
      "session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax"
    )

    return res.status(200).json({ success: true })

  } catch (err) {
    return res.status(500).json({ error: "Logout failed" })
  }
}
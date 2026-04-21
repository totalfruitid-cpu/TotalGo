import admin from "../../../lib/firebaseAdmin"

export default async function handler(req, res) {
  try {
    const token = req.cookies.session

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const decoded = await admin.auth().verifySessionCookie(token, true)
    const uid = decoded.uid

    const doc = await admin.firestore().collection("users").doc(uid).get()

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" })
    }

    const role = doc.data()?.role || "user"

    const allowed = ["admin", "kasir", "user"]

    if (!allowed.includes(role)) {
      return res.status(403).json({ error: "Invalid role" })
    }

    return res.status(200).json({ role })

  } catch (err) {
    console.error("checkRole error:", err)
    return res.status(401).json({ error: "Unauthorized" })
  }
}
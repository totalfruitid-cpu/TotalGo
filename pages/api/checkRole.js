import admin from "../../lib/firebaseAdmin"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // 🔥 ambil session cookie
    const token = req.cookies?.session

    if (!token) {
      return res.status(401).json({ error: "No session" })
    }

    // 🔥 verify session cookie (BUKAN verifyIdToken)
    const decoded = await admin.auth().verifySessionCookie(token, true)
    const uid = decoded.uid

    // 🔥 ambil role dari Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" })
    }

    const role = userDoc.data().role || "user"

    return res.status(200).json({ role })

  } catch (err) {
    console.error("CHECK ROLE ERROR:", err)
    return res.status(401).json({ error: "Unauthorized" })
  }
}
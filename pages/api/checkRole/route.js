import admin from "../../../lib/firebaseAdmin"

export default async function handler(req, res) {
  try {
    const token = req.cookies.session

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const decoded = await admin.auth().verifySessionCookie(token, true)
    const uid = decoded.uid

    const userDoc = await admin.firestore().collection("users").doc(uid).get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" })
    }

    const role = userDoc.data().role || "user"

    if (role !== "admin" && role !== "kasir" && role !== "user") {
      return res.status(403).json({ error: "Invalid role" })
    }

    return res.status(200).json({ role })

  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" })
  }
}
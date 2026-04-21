import admin from "firebase-admin"

let app

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  // 🔥 FIX WAJIB: handle newline dari Vercel
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n")
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin env belum lengkap")
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
} else {
  app = admin.app()
}

export default admin
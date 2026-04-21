import { auth } from "../lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useRouter } from "next/router"

export default function Login() {
  const router = useRouter()
  
  const login = async (email, password) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCred.user.getIdToken()

      // 1. Tuker ke session cookie
      const loginRes = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      })
      if (!loginRes.ok) throw new Error("Gagal membuat session")

      // 2. Ambil role pake cookie
      const res = await fetch("/api/checkRole", {
        method: "GET",
        credentials: "include"
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal ambil role")

      // 3. Redirect
      if (data.role === "kasir") router.replace("/kasir")
      else if (data.role === "admin") router.replace("/admin")
      else router.replace("/store")

    } catch (err) {
      console.error("LOGIN ERROR:", err)
      alert(err.message)
    }
  }

  return ( /* ... form login lu */ )
}
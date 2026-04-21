import { useState } from "react"
import { useRouter } from "next/router"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../lib/firebase"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (loading) return
    setLoading(true)

    try {
      // 🔥 Firebase login
      const userCred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      const idToken = await userCred.user.getIdToken()

      // 🔥 ONE REQUEST ONLY (cookie + role)
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Login gagal")
      }

      // 🔥 direct redirect based on role
      if (data.role === "admin") {
        router.replace("/admin")
      } else if (data.role === "kasir") {
        router.replace("/kasir")
      } else {
        router.replace("/store")
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleLogin()
      }}
    >
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Login"}
      </button>
    </form>
  )
}
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
      const userCred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      const idToken = await userCred.user.getIdToken()

      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Login gagal")
      }

      // 🔥 SAFETY CHECK ROLE
      const role = data.role || "store"

      // optional: sync storage (biar UI gak blank reload)
      localStorage.setItem("role", role)

      // 🔥 redirect sinkron system
      switch (role) {
        case "admin":
          router.replace("/admin")
          break
        case "kasir":
          router.replace("/kasir")
          break
        default:
          router.replace("/store")
      }

    } catch (err) {
      console.error(err)
      alert(
        err.code === "auth/wrong-password"
          ? "Password salah"
          : err.code === "auth/user-not-found"
          ? "User tidak ditemukan"
          : err.message
      )
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
      style={{ padding: 20, fontFamily: "sans-serif" }}
    >
      <h2>Login</h2>

      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />

      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Login"}
      </button>
    </form>
  )
}
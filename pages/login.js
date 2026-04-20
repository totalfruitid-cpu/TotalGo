import { useState } from "react"
import { useRouter } from "next/router"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "../lib/firebase"
import Head from "next/head"

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const from = router.query.from || null
  const sessionError = router.query.error

  if (sessionError === "session_expired" && !error) {
    setError("Sesi Anda habis. Silakan login lagi.")
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!email.includes("@") || password.length < 6) {
      setError("Email atau password tidak valid")
      setLoading(false)
      return
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCred.user.getIdToken(true)

      const res = await fetch("/api/setCookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membuat sesi")

      const roleRoutes = {
        admin: "/admin",
        kasir: "/kasir"
      }

      const target = roleRoutes[data.role]

      if (!target) {
        await signOut(auth)
        await fetch("/api/logout", { method: "POST" })
        throw new Error("Akun ini tidak punya akses ke sistem")
      }

      router.replace(from || target)

    } catch (err) {
      console.error(err)

      if (err.code === "auth/wrong-password") setError("Password salah")
      else if (err.code === "auth/user-not-found") setError("Email tidak terdaftar")
      else if (err.code === "auth/too-many-requests") setError("Terlalu banyak percobaan. Coba lagi nanti")
      else setError(err.message || "Login gagal")

    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login - TotalGo</title>
      </Head>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        background: "#f5f5f5"
      }}>
        <form onSubmit={handleLogin} style={{
          padding: 24,
          background: "white",
          borderRadius: 12,
          width: 320,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}>
          <h2>TotalGo Login</h2>

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            disabled={loading}
          />

          {error && (
            <p style={{ color: "red", fontSize: 12, marginBottom: 10 }}>
              {error}
            </p>
          )}

          <button style={btnStyle} disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>
      </div>
    </>
  )
}

const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  boxSizing: "border-box"
}

const btnStyle = {
  width: "100%",
  padding: 10,
  background: "#000",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
}
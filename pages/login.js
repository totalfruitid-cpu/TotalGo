import { useState } from "react"
import { useRouter } from "next/router"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../lib/firebase"

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // 1. Firebase login
      const userCred = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCred.user.getIdToken(true)

      // 2. kirim ke API login (INI SOURCE OF TRUTH)
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Login gagal")
      }

      // 3. redirect berdasarkan role
      if (data.role === "admin") {
        router.replace("/admin")
      } else if (data.role === "kasir") {
        router.replace("/kasir")
      } else {
        router.replace("/unauthorized")
      }

    } catch (err) {
      setError(err.message || "Login gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          disabled={loading}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    fontFamily: "sans-serif",
  },
  form: {
    padding: 24,
    background: "white",
    borderRadius: 12,
    width: 320,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
  },
  button: {
    width: "100%",
    padding: 10,
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  error: {
    color: "red",
    fontSize: 12,
  },
}
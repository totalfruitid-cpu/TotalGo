import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { auth } from "../lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"

export default function Admin() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ================= AUTH GUARD =================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/login")
      } else {
        setUser(u)
        setLoading(false)
      }
    })

    return () => unsub()
  }, [router])

  // ================= LOGOUT =================
  const logout = async () => {
    try {
      await signOut(auth)
      await fetch("/api/logout", { method: "POST" })
      router.replace("/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  // ================= LOADING =================
  if (loading) {
    return (
      <div style={styles.loading}>
        Loading admin panel...
      </div>
    )
  }

  // ================= UI =================
  return (
    <div style={styles.page}>
      <div style={styles.container}>

        <div style={styles.card}>
          <h1 style={styles.title}>ADMIN DASHBOARD</h1>

          <p style={styles.email}>
            {user?.email}
          </p>

          <div style={styles.infoBox}>
            <p>✔ System: TotalGo Admin</p>
            <p>✔ Role: Admin</p>
            <p>✔ Status: Active</p>
          </div>

          <button onClick={logout} style={styles.logout}>
            Logout
          </button>
        </div>

      </div>
    </div>
  )
}

/* ================= STYLE ================= */
const styles = {
  page: {
    background: "#0f172a",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    width: "100%",
    maxWidth: 420,
    padding: 16,
  },

  card: {
    background: "#1e293b",
    padding: 24,
    borderRadius: 16,
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },

  title: {
    marginBottom: 10,
    fontSize: 22,
  },

  email: {
    opacity: 0.7,
    fontSize: 13,
    marginBottom: 20,
  },

  infoBox: {
    textAlign: "left",
    background: "#0f172a",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 13,
    lineHeight: 1.6,
  },

  logout: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  loading: {
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
}
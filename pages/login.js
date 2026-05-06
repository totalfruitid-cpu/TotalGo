import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../lib/firebase" // <-- PASTIKAN db DI-IMPORT
import { doc, getDoc } from "firebase/firestore" // <-- INI KUNCINYA

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState("")

  // AUTO REDIRECT KALO UDAH LOGIN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // AMBIL ROLE DARI FIRESTORE, BUKAN CLAIMS
          const userDoc = await getDoc(doc(db, "users", user.uid))
          const role = userDoc.exists()? userDoc.data().role : "store"

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
          console.error("Gagal cek role:", err)
          setCheckingAuth(false)
        }
      } else {
        setCheckingAuth(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError("")

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password)

      // AMBIL ROLE DARI FIRESTORE
      const userDoc = await getDoc(doc(db, "users", userCred.user.uid))

      if (!userDoc.exists()) {
        throw new Error("Akun belum terdaftar di database")
      }

      const role = userDoc.data().role || "store"
      localStorage.setItem("role", role) // Optional, buat cek di page lain

      // LEMPAR SESUAI ROLE
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
      if (err.code === "auth/wrong-password") {
        setError("Password salah bro")
      } else if (err.code === "auth/user-not-found") {
        setError("Email tidak terdaftar")
      } else if (err.code === "auth/invalid-email") {
        setError("Format email salah")
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Loading pas cek auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🛵</div>
          <h1 className="text-3xl font-bold text-gray-800">TotalGo</h1>
          <p className="text-gray-500 mt-1">Fresh Fruit Delivery</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Login Kasir/Admin</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="admin@totalgo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                loading
                ? 'bg-gray-300 text-gray-500'
                  : 'bg-[#F97316] text-white hover:bg-orange-600 active:scale-95'
              }`}
            >
              {loading? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Loading...
                </div>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/store')}
              className="text-[#F97316] font-semibold text-sm hover:underline"
            >
              ← Kembali ke Store
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          © 2026 TotalGo. All rights reserved.
        </p>
      </div>
    </div>
  )
}

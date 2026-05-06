import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("1. User login:", user.uid)
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          console.log("2. Doc exists:", userDoc.exists())

          if (!userDoc.exists()) {
            console.log("3. GAGAL: User gak ada di collection users")
            setError("Akun belum terdaftar di database")
            setCheckingAuth(false)
            await auth.signOut() // Logout paksa
            return
          }

          const data = userDoc.data()
          console.log("4. Data Firestore:", data)

          const role = data?.role || "store"
          console.log("5. Role final:", role)

          if (role === "admin") {
            console.log("6. Lempar ke /admin")
            router.replace("/admin")
          } else if (role === "kasir") {
            console.log("6. Lempar ke /kasir")
            router.replace("/kasir")
          } else {
            console.log("6. Lempar ke /store")
            router.replace("/store")
          }

        } catch (err) {
          console.error("ERROR GEDE:", err.code, err.message)
          setError("Gagal cek role: " + err.message)
          setCheckingAuth(false) // WAJIB biar gak stuck loading
        }
      } else {
        console.log("User belum login")
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
      await signInWithEmailAndPassword(auth, email, password)
      // Redirect udah dihandle useEffect di atas
    } catch (err) {
      console.error(err)
      if (err.code === "auth/wrong-password") setError("Password salah bro")
      else if (err.code === "auth/user-not-found") setError("Email tidak terdaftar")
      else setError(err.message)
      setLoading(false)
    }
  }

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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                loading? 'bg-gray-300 text-gray-500' : 'bg-[#F97316] text-white hover:bg-orange-600'
              }`}
            >
              {loading? 'Loading...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

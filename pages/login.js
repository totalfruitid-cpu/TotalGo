import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const role = userDoc.data().role?.trim()
            if (role === 'kasir') router.replace('/kasir')
            else if (role === 'admin') router.replace('/admin')
            else router.replace('/')
          } else {
            router.replace('/')
          }
        } catch (err) {
          console.error("Gagal cek role:", err)
          if (isMounted) setLoading(false)
        }
      } else {
        if (isMounted) setLoading(false)
      }
    })
    return () => { isMounted = false; unsubscribe() }
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Email atau password salah')
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="animate-pulse text-[#F97316] font-bold text-lg">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8 text-center">
        {/* LOGO PAKE EMOJI / SVG BIAR GAK 404 */}
        <div className="text-6xl mb-2">🛵</div>
        <h1 className="text-3xl font-bold text-gray-800">TotalGo</h1>
        <p className="text-gray-500">Fresh Fruit Delivery</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Login Kasir/Admin
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 border border-gray-200 bg-blue-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              placeholder="khasbullah22@gmail.com"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mt-1 border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F97316] text-white py-3 rounded-xl font-bold active:scale-95 disabled:bg-gray-300 transition-all"
          >
            Masuk
          </button>
          {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
        </form>
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-[#F97316] hover:underline">
            ← Kembali ke Store
          </Link>
        </div>
      </div>
    </div>
  )
}

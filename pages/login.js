import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true) // <-- loading true biar cek auth dulu

  useEffect(() => {
    let isMounted = true // <-- ANTI LOOP

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
          setLoading(false) // <-- stop loading kalo error
        }
      } else {
        setLoading(false) // <-- stop loading kalo gak login
      }
    })
    return () => {
      isMounted = false
      unsubscribe()
    }
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

  // PAS LOADING CEK AUTH, JANGAN TAMPILIN FORM DULU
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="animate-pulse text-[#F97316] font-bold">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#F97316] mb-6 text-center">
          Login TotalGO 🍓
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F97316] text-white py-3 rounded-xl font-bold active:scale-95 disabled:bg-gray-300"
          >
            {loading? 'Loading...' : 'Login'}
          </button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </form>
      </div>
    </div>
  )
}

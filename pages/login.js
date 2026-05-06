import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore' // INI YG KURANG TADI
import { auth, db } from '../lib/firebase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Cek kalo udah login, langsung lempar sesuai role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            const role = userDoc.data().role
            if (role === 'kasir') router.replace('/kasir')
            else if (role === 'admin') router.replace('/admin')
            else router.replace('/') // role lain lempar ke home
          } else {
            router.replace('/') // user gak ada di collection
          }
        } catch (err) {
          console.error("Gagal cek role:", err)
        }
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Gak usah router.push disini, biar useEffect di atas yg handle
    } catch (err) {
      setError('Email atau password salah')
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Login TotalGO</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading? 'Loading...' : 'Login'}
        </button>
        {error && <p style={{color: 'red'}}>{error}</p>}
      </form>
    </div>
  )
}

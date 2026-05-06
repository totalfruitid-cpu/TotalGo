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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const role = userDoc.data().role?.trim() // <-- TAMBAHIN.trim()
            console.log('ROLE KEBACA:', JSON.stringify(role)) // <-- BUAT DEBUG

            if (role === 'kasir') {
              console.log('LEMPAR KE /kasir')
              router.replace('/kasir')
            }
            else if (role === 'admin') {
              console.log('LEMPAR KE /admin')
              router.replace('/admin')
            }
            else {
              console.log('ROLE GAK MATCH, LARI KE /')
              router.replace('/')
            }
          } else {
            console.log('USERDOC GAK ADA')
            router.replace('/')
          }
        } catch (err) {
          console.error("Gagal cek role:", err)
          router.replace('/')
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
      // abis ini onAuthStateChanged yg handle
    } catch (err) {
      setError('Email atau password salah')
      setLoading(false)
    }
  }

  return (
    <div style={{padding: 40, fontFamily: 'sans-serif'}}>
      <h1>Login TotalGO</h1>
      <form onSubmit={handleLogin}>
        <div style={{marginBottom: 12}}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{padding: 8, width: 250}}
          />
        </div>
        <div style={{marginBottom: 12}}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{padding: 8, width: 250}}
          />
        </div>
        <button type="submit" disabled={loading} style={{padding: '8px 16px'}}>
          {loading? 'Loading...' : 'Login'}
        </button>
        {error && <p style={{color: 'red', marginTop: 10}}>{error}</p>}
      </form>
    </div>
  )
}

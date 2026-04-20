import { useState, useEffect } from "react"
import { useRouter } from "next/router" // pake next/navigation kalo app dir
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "../lib/firebase"
import Head from "next/head"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)

  // PENGAMAN 1: Kalo udah login, tendang keluar dari halaman login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Cek session udah valid belum
        const res = await fetch('/api/verifySession')
        if (res.ok) {
          const { role } = await res.json()
          const redirect = role === 'admin'? '/admin' : role === 'kasir'? '/kasir' : '/'
          router.replace(redirect)
        }
      }
      setCheckingSession(false)
    })
    return () => unsub()
  }, [router])

  // Baca query?from=/admin buat redirect balik abis login
  const from = router.query.from || null
  const sessionError = router.query.error

  useEffect(() => {
    if (sessionError === 'session_expired') {
      setError('Sesi Anda habis. Silakan login lagi.')
    }
  }, [sessionError])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // PENGAMAN 2: Validasi basic
    if (!email.includes('@') || password.length < 6) {
      setError('Email atau password tidak valid')
      setLoading(false)
      return
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password)

      // PENGAMAN 3: Force refresh token biar Custom Claims terbaru kebawa
      const idToken = await userCred.user.getIdToken(true)

      const res = await fetch("/api/setCookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal membuat sesi')

      // PENGAMAN 4: NO FALLBACK. Role harus jelas admin/kasir
      const roleRoutes = { admin: "/admin", kasir: "/kasir" }
      const target = roleRoutes[data.role]

      if (!target) {
        await signOut(auth) // PENGAMAN 5: Logout paksa kalo role 'user'
        await fetch('/api/logout', { method: 'POST' }) // hapus cookie
        throw new Error("Akun ini tidak punya akses ke
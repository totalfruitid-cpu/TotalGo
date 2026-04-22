import '../styles/globals.css'
import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../lib/firebase"
import { useRouter } from "next/router"

export default function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  useEffect(() => {
    if (loading) return

    const publicRoutes = ["/login"]

    const isPublic = publicRoutes.includes(router.pathname)

    if (!user && !isPublic) {
      router.replace("/login")
    }
  }, [user, loading, router.pathname])

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        Loading system...
      </div>
    )
  }

  return <Component {...pageProps} user={user} />
}
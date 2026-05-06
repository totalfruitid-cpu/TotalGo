import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase' // sesuaikan path firebase lu

export default function Kasir() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (!userDoc.exists() || userDoc.data().role!== 'kasir') {
          router.push('/unauthorized') // atau ke '/'
          return
        }
        setLoading(false)
      } catch (error) {
        console.error("Error cek role:", error)
        router.push('/login')
      }
    })

    return () => unsubscribe() // INI YG MATIIN SPAM 2178 REQUESTS
  }, [router])

  if (loading) return <div>Loading Dashboard Kasir...</div>

  return (
    <div>
      <h1>Dashboard Kasir</h1>
      {/* Taruh isi dashboard kasir lu disini */}
    </div>
  )
}

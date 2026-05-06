import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export default function Kasir() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login')
        return
      }

      try {
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)

        if (!userDoc.exists()) {
          router.replace('/unauthorized')
          return
        }

        const data = userDoc.data()
        if (data.role!== 'kasir') {
          router.replace('/unauthorized')
          return
        }

        setUserData(data)
        setLoading(false)
      } catch (error) {
        console.error("Error cek role:", error)
        router.replace('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) return <div style={{padding: 40}}>Loading Dashboard Kasir...</div>

  return (
    <div style={{padding: 40, fontFamily: 'sans-serif'}}>
      <h1>Dashboard Kasir</h1>
      <p>Halo {userData?.nama}</p>
      <button onClick={() => auth.signOut()}>Logout</button>
    </div>
  )
}

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
        router.replace('/login') // PAKE REPLACE BIAR GAK NUMPUK HISTORY
        return
      }

      try {
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)

        if (!userDoc.exists()) {
          console.log("User gak ada di collection users")
          router.replace('/unauthorized')
          return
        }

        const data = userDoc.data()
        if (data.role!== 'kasir') {
          console.log("Role bukan kasir:", data.role)
          router.replace('/unauthorized') // atau '/'
          return
        }

        setUserData(data)
        setLoading(false) // INI KUNCINYA
      } catch (error) {
        console.error("Error cek role:", error)
        router.replace('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) return <div>Loading Dashboard Kasir...</div>

  return (
    <div>
      <h1>Dashboard Kasir</h1>
      <p>Halo {userData?.nama}</p>
    </div>
  )
}

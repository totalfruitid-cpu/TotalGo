import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useRouter } from 'next/router'

export default function Kasir() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) router.replace('/login')
      else setLoading(false)
    })
  }, [router])

  if (loading) return <div>Loading...</div>

  return <h1>TEMBUS CUY - DASHBOARD KASIR</h1>
}

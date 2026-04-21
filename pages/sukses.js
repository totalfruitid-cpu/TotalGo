// pages/Sukses.js
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../lib/firebase"

export default function Sukses() {
  const router = useRouter()
  const { orderId } = router.query
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!orderId) return

    const fetch = async () => {
      const snap = await getDoc(doc(db, "orders", orderId))
      if (snap.exists()) setOrder(snap.data())
    }

    fetch()
  }, [orderId])

  if (!order) return <div>Loading...</div>

  return (
    <div>
      <h1>ORDER BERHASIL</h1>
      <h2>{order.nama}</h2>
      <h3>{order.grandTotal}</h3>
      <p>Status: {order.status}</p>
    </div>
  )
}
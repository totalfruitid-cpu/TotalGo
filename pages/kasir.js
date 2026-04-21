import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, onSnapshot } from "firebase/firestore"

export default function Kasir() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        console.log("🔥 DATA MASUK:", data)
        setOrders(data)
      },
      (err) => {
        console.error("❌ ERROR LISTEN:", err)
      }
    )

    return () => unsub()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>KASIR ({orders.length})</h1>

      {orders.map(o => (
        <div key={o.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <p>{o.nama}</p>
          <p>{o.metode}</p>
          <p>{o.total}</p>
          <p>{o.status}</p>
        </div>
      ))}
    </div>
  )
}
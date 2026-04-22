import { useEffect, useState, useRef } from "react"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore"
import { db } from "../lib/firebase"

export default function Kasir() {
  const [orders, setOrders] = useState([])
  const audioRef = useRef(null)

  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3")

    const q = query(
      collection(db, "orders"),
      where("status", "==", "pending"),
      orderBy("waktu", "desc")
    )

    let prevIds = []

    const unsub = onSnapshot(q, (snap) => {
      const newOrders = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))

      // 🔥 detect order baru (lebih stabil)
      const newIds = newOrders.map(o => o.id)
      const hasNew = newIds.some(id => !prevIds.includes(id))

      if (hasNew && prevIds.length !== 0) {
        audioRef.current?.play()
      }

      prevIds = newIds
      setOrders(newOrders)
    })

    return () => unsub()
  }, [])

  const done = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "done"
      })
    } catch (err) {
      alert("Gagal update: " + err.message)
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>🔥 KASIR LIVE</h1>

      {orders.length === 0 && <p>No pending orders</p>}

      {orders.map(o => (
        <div key={o.id} style={{ border: "1px solid #ddd", margin: 10, padding: 10 }}>
          
          <h3>{o.nama}</h3>
          <p>Rp{o.grandTotal}</p>

          <p>Status: {o.status}</p>

          <div>
            {o.items?.map((i, idx) => (
              <div key={idx}>
                {i.nama} ({i.varian}) x{i.qty}
              </div>
            ))}
          </div>

          <button onClick={() => done(o.id)}>
            DONE
          </button>

        </div>
      ))}
    </div>
  )
}
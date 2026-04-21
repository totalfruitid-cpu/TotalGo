import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore"

export default function Kasir() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), snap => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))
      setOrders(data)
    })

    return () => unsub()
  }, [])

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status })
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>KASIR</h1>

      {orders.map(o => (
        <div key={o.id} style={{ border: "1px solid #ccc", marginBottom: 10, padding: 10 }}>
          <h3>{o.queue}</h3>
          <p>Nama: {o.nama}</p>
          <p>Metode: {o.metode}</p>
          <p>Status: {o.status}</p>
          <p>Total: {o.total}</p>

          {o.items?.map((i, idx) => (
            <div key={idx}>
              {i.qty}x {i.nama} ({i.variant})
            </div>
          ))}

          <button onClick={() => updateStatus(o.id, "Diproses")}>Proses</button>
          <button onClick={() => updateStatus(o.id, "Selesai")}>Selesai</button>
        </div>
      ))}
    </div>
  )
}
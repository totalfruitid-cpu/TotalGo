import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore"

export default function Kasir() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState("pending")

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      if (filter === "pending") {
        setOrders(data.filter(o => o.status === "pending"))
      } else if (filter === "done") {
        setOrders(data.filter(o => o.status === "done"))
      } else {
        setOrders(data)
      }
    })

    return () => unsub()
  }, [filter])

  const doneOrder = async (id) => {
    await updateDoc(doc(db, "orders", id), { status: "done" })
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>KASIR</h2>

      <button onClick={() => setFilter("pending")}>Pending</button>
      <button onClick={() => setFilter("done")}>Done</button>
      <button onClick={() => setFilter("all")}>All</button>

      {orders.length === 0 && <p>Tidak ada order</p>}

      {orders.map((order) => (
        <div key={order.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          
          <h3>Meja {order.meja}</h3>
          <p>Status: {order.status}</p>

          <ul>
            {order.items?.map((item, i) => (
              <li key={i}>
                {item.qty}x {item.nama} ({item.variant}) - Rp{item.harga}
              </li>
            ))}
          </ul>

          <b>Total: Rp{order.total?.toLocaleString("id-ID")}</b>

          {order.status === "pending" && (
            <button onClick={() => doneOrder(order.id)}>
              Tandai Selesai
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
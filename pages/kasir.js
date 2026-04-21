// pages/kasir.js
import { useEffect, useState, useRef } from "react"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore"
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

    const unsub = onSnapshot(q, (snap) => {
      const newOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }))

      if (newOrders.length > orders.length) {
        audioRef.current.play()
      }

      setOrders(newOrders)
    })

    return () => unsub()
  }, [orders.length])

  const done = async (id) => {
    await updateDoc(doc(db, "orders", id), {
      status: "done"
    })
  }

  return (
    <div>
      <h1>KASIR LIVE</h1>

      {orders.map(o => (
        <div key={o.id}>
          <h3>{o.nama}</h3>
          <p>{o.grandTotal}</p>

          <button onClick={() => done(o.id)}>
            DONE
          </button>
        </div>
      ))}
    </div>
  )
}
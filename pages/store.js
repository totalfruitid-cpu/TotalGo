import { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../firebase"

export default function Store() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "products"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))

        setProducts(data)
        setLoading(false)
      },
      (err) => {
        console.error("STORE ERROR:", err)
        setProducts([])
        setLoading(false) // 🔥 WAJIB BIAR GAK STUCK
      }
    )

    return () => unsub()
  }, [])

  // 🔥 SAFE RENDER FLOW
  if (loading) {
    return <div className="p-4">Loading produk...</div>
  }

  if (!products.length) {
    return <div className="p-4">Produk belum ada bos</div>
  }

  return (
    <div className="p-4">
      <h1>Store</h1>

      {products.map((p) => (
        <div key={p.id}>
          <p>{p.nama}</p>
          <p>{p.harga}</p>
        </div>
      ))}
    </div>
  )
}
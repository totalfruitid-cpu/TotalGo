import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../lib/firebase"

export default function Sukses() {
  const router = useRouter()
  const { orderId } = router.query

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      try {
        setLoading(true)

        const snap = await getDoc(doc(db, "orders", orderId))

        if (!snap.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }

        setOrder({
          id: snap.id,
          ...snap.data()
        })

      } catch (err) {
        console.error(err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return <div style={{ padding: 20 }}>Loading order...</div>
  }

  if (notFound) {
    return <div style={{ padding: 20 }}>Order tidak ditemukan</div>
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>🎉 ORDER BERHASIL</h1>

      <h2>{order.nama}</h2>

      <p>Alamat: {order.alamat}</p>
      <p>No HP: {order.noHp}</p>

      <h3>Total: Rp{order.grandTotal}</h3>
      <p>Status: {order.status}</p>

      <h4>Items:</h4>
      {order.items?.map((i, idx) => (
        <div key={idx}>
          {i.nama} ({i.varian}) x{i.qty} - Rp{i.harga}
        </div>
      ))}

      <button onClick={() => router.push("/store")}>
        Kembali ke Store
      </button>
    </div>
  )
}
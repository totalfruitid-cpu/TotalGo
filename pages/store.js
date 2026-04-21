import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [table, setTable] = useState("")
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"))
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  const addToCart = (p, variant) => {
    const price =
      variant === "lite" ? p.harga_lite :
      variant === "healthy" ? p.harga_healthy :
      p.harga_sultan

    setCart(prev => {
      const exist = prev.find(i => i.id === p.id && i.variant === variant)

      if (exist) {
        return prev.map(i =>
          i.id === p.id && i.variant === variant
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      }

      return [
        ...prev,
        {
          id: p.id,
          nama: p.nama || "Unknown",
          variant,
          harga: Number(price || 0),
          qty: 1
        }
      ]
    })
  }

  const checkout = async () => {
    try {
      if (!table || table.trim() === "") {
        alert("Isi nomor meja")
        return
      }

      if (!cart || cart.length === 0) {
        alert("Cart kosong")
        return
      }

      setCheckingOut(true)

      const safeItems = cart.map(item => ({
        nama: item.nama ? String(item.nama) : "Unknown",
        variant: item.variant ? String(item.variant) : "lite",
        qty: item.qty ? Number(item.qty) : 1,
        harga: item.harga ? Number(item.harga) : 0,
      }))

      const total = safeItems.reduce((a, b) => a + b.harga * b.qty, 0)

      await addDoc(collection(db, "orders"), {
        meja: String(table),
        items: safeItems,
        total: Number(total),
        status: "pending",
        createdAt: Date.now()
      })

      setCart([])
      setTable("")
      alert("Order berhasil")

    } catch (err) {
      console.error("ERROR:", err)
      alert("Checkout gagal: " + err.message)
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>STORE</h1>

      <input
        placeholder="No Meja"
        value={table}
        onChange={(e) => setTable(e.target.value)}
      />

      <div>
        {products.map(p => (
          <div key={p.id}>
            <h3>{p.nama}</h3>

            <button onClick={() => addToCart(p, "lite")}>
              Lite
            </button>
            <button onClick={() => addToCart(p, "healthy")}>
              Healthy
            </button>
            <button onClick={() => addToCart(p, "sultan")}>
              Sultan
            </button>
          </div>
        ))}
      </div>

      <h2>Cart</h2>
      {cart.map((c, i) => (
        <div key={i}>
          {c.qty}x {c.nama} ({c.variant})
        </div>
      ))}

      <button onClick={checkout} disabled={checkingOut}>
        {checkingOut ? "Processing..." : "Checkout"}
      </button>
    </div>
  )
}
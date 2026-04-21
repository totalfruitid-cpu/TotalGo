import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [table, setTable] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"))
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setProducts(data)
    setLoading(false)
  }

  const getPrice = (p, variant) => {
    if (!p.punya_varian) return p.harga_lite || 0
    if (variant === "lite") return p.harga_lite
    if (variant === "healthy") return p.harga_healthy
    if (variant === "sultan") return p.harga_sultan
    return p.harga_lite
  }

  const addToCart = (p, variant = "lite") => {
    const price = getPrice(p, variant)

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
          nama: p.nama,
          variant,
          harga: price,
          qty: 1
        }
      ]
    })
  }

  const removeItem = (id, variant) => {
    setCart(cart.filter(i => !(i.id === id && i.variant === variant)))
  }

  const total = cart.reduce((a, b) => a + b.harga * b.qty, 0)

  const checkout = async () => {
    if (!table || cart.length === 0) return alert("Isi meja & cart")

    await addDoc(collection(db, "orders"), {
      meja: table,
      items: cart,
      total,
      status: "pending",
      createdAt: serverTimestamp()
    })

    setCart([])
    setTable("")
    alert("Order terkirim")
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: 16 }}>
      <h2>STORE</h2>

      <input
        placeholder="Meja"
        value={table}
        onChange={e => setTable(e.target.value)}
      />

      <div>
        {products.map(p => (
          <div key={p.id} style={{ margin: 10, padding: 10, border: "1px solid #ccc" }}>
            <h3>{p.nama}</h3>

            {p.punya_varian ? (
              <>
                <button onClick={() => addToCart(p, "lite")}>Lite</button>
                <button onClick={() => addToCart(p, "healthy")}>Healthy</button>
                <button onClick={() => addToCart(p, "sultan")}>Sultan</button>
              </>
            ) : (
              <button onClick={() => addToCart(p, "lite")}>Add</button>
            )}
          </div>
        ))}
      </div>

      <hr />

      <h3>Cart</h3>
      {cart.map((c, i) => (
        <div key={i}>
          {c.qty}x {c.nama} ({c.variant}) - {c.harga}
          <button onClick={() => removeItem(c.id, c.variant)}>x</button>
        </div>
      ))}

      <h3>Total: Rp{total.toLocaleString()}</h3>

      <button onClick={checkout}>Checkout</button>
    </div>
  )
}
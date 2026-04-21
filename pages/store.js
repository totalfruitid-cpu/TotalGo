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

  const getPrice = (p, v) => {
    if (!p.punya_varian) return p.harga_lite || 0
    if (v === "lite") return p.harga_lite
    if (v === "healthy") return p.harga_healthy
    if (v === "sultan") return p.harga_sultan
    return 0
  }

  const addToCart = (p, variant) => {
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

  const checkout = async () => {
    if (!table) return alert("Isi nomor meja")
    if (cart.length === 0) return alert("Cart kosong")

    try {
      setCheckingOut(true)

      const total = cart.reduce((a, b) => a + b.harga * b.qty, 0)

      await addDoc(collection(db, "orders"), {
        meja: table,
        items: cart,
        total,
        status: "pending",
        createdAt: Date.now()
      })

      setCart([])
      setTable("")
      alert("Order berhasil")
    } catch (err) {
      console.error(err)
      alert("Checkout gagal")
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>STORE</h1>

      <input
        placeholder="Meja"
        value={table}
        onChange={(e) => setTable(e.target.value)}
      />

      <div>
        {products.map(p => (
          <div key={p.id}>
            <h3>{p.nama}</h3>

            {p.punya_varian ? (
              <>
                <button onClick={() => addToCart(p, "lite")}>
                  Lite - {p.harga_lite}
                </button>
                <button onClick={() => addToCart(p, "healthy")}>
                  Healthy - {p.harga_healthy}
                </button>
                <button onClick={() => addToCart(p, "sultan")}>
                  Sultan - {p.harga_sultan}
                </button>
              </>
            ) : (
              <button onClick={() => addToCart(p, "lite")}>
                Add
              </button>
            )}
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
        {checkingOut ? "Loading..." : "Checkout"}
      </button>
    </div>
  )
}
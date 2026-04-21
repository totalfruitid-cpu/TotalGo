import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

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

  // ================= VARIANT PRICE =================
  const getPrice = (p, v) => {
    if (!p.punya_varian) return p.harga_lite || 0
    if (v === "lite") return p.harga_lite
    if (v === "healthy") return p.harga_healthy
    if (v === "sultan") return p.harga_sultan
    return 0
  }

  // ================= ADD CART =================
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

  // ================= CHECKOUT FIX =================
  const checkout = async () => {
    if (!table) return alert("Isi nomor meja dulu")
    if (cart.length === 0) return alert("Cart kosong")

    try {
      setCheckingOut(true)

      await addDoc(collection(db, "orders"), {
        meja: table,
        items: cart,
        total: cart.reduce((a, b) => a + b.harga * b.qty, 0),
        status: "pending",
        createdAt: serverTimestamp()
      })

      setCart([])
      setTable("")
      alert("Order berhasil dikirim")
    } catch (err) {
      console.error("Checkout error:", err)
      alert("Checkout gagal")
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <h1 style={styles.title}>TOTALGO STORE</h1>

        {/* TABLE INPUT */}
        <input
          placeholder="Nomor Meja"
          value={table}
          onChange={(e) => setTable(e.target.value)}
          style={styles.input}
        />

        {/* PRODUCTS */}
        <div style={styles.grid}>
          {products.map(p => (
            <div key={p.id} style={styles.card}>
              <h3>{p.nama}</h3>

              {/* VARIANT BOX */}
              {p.punya_varian ? (
                <div style={styles.variantBox}>
                  <button onClick={() => addToCart(p, "lite")}>
                    Lite<br />{p.harga_lite}
                  </button>

                  <button onClick={() => addToCart(p, "healthy")}>
                    Healthy<br />{p.harga_healthy}
                  </button>

                  <button onClick={() => addToCart(p, "sultan")}>
                    Sultan<br />{p.harga_sultan}
                  </button>
                </div>
              ) : (
                <button onClick={() => addToCart(p, "lite")}>
                  Add
                </button>
              )}
            </div>
          ))}
        </div>

        {/* CART */}
        <div style={styles.cart}>
          <h3>Cart</h3>

          {cart.map((c, i) => (
            <div key={i}>
              {c.qty}x {c.nama} ({c.variant}) - Rp{c.harga}
            </div>
          ))}

          <h3>
            Total: Rp{" "}
            {cart.reduce((a, b) => a + b.harga * b.qty, 0).toLocaleString()}
          </h3>

          <button
            onClick={checkout}
            disabled={checkingOut}
            style={styles.checkoutBtn}
          >
            {checkingOut ? "Processing..." : "Checkout"}
          </button>
        </div>

      </div>
    </div>
  )
}

/* ================= STYLE ================= */
const styles = {
  page: {
    background: "#0f172a",
    color: "#fff",
    minHeight: "100vh",
    padding: 16,
    fontFamily: "sans-serif",
  },

  container: {
    maxWidth: 700,
    margin: "0 auto",
  },

  title: {
    textAlign: "center",
    marginBottom: 10,
  },

  input: {
    width: "100%",
    padding: 10,
    marginBottom: 16,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  card: {
    background: "#1e293b",
    padding: 12,
    borderRadius: 10,
  },

  variantBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 5,
  },

  cart: {
    marginTop: 20,
    background: "#111827",
    padding: 12,
    borderRadius: 10,
  },

  checkoutBtn: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    background: "#22c55e",
    border: "none",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
  },
}
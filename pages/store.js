import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

const MENU_IMAGE = "/menu/"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [table, setTable] = useState("")

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"))
    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    setProducts(data)
    setLoading(false)
  }

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id)
      if (exists) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + 1 } : p
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.harga_lite * item.qty, 0)
  }

  const checkout = async () => {
    if (!table || cart.length === 0) return alert("Isi meja & keranjang dulu")

    await addDoc(collection(db, "orders"), {
      meja: table,
      items: cart,
      total: getTotal(),
      status: "pending",
      createdAt: serverTimestamp(),
    })

    alert("Order berhasil dikirim 🚀")
    setCart([])
    setTable("")
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading menu...
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>TotalGo Store</h1>
        <p style={styles.subtitle}>Fresh Juice • Fast Order</p>
      </div>

      {/* TABLE INPUT */}
      <div style={styles.section}>
        <input
          placeholder="Nomor Meja"
          value={table}
          onChange={(e) => setTable(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* MENU LIST */}
      <div style={styles.grid}>
        {products.map((p) => (
          <div key={p.id} style={styles.card}>
            <img
              src={p.gambar_url || MENU_IMAGE + "placeholder.png"}
              style={styles.image}
            />

            <div style={styles.cardBody}>
              <h3 style={styles.productName}>{p.nama}</h3>
              <p style={styles.price}>
                Rp {(p.harga_lite || 0).toLocaleString("id-ID")}
              </p>

              <button
                onClick={() => addToCart(p)}
                style={styles.button}
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CART */}
      <div style={styles.cart}>
        <h2 style={{ marginBottom: 10 }}>🛒 Keranjang</h2>

        {cart.length === 0 ? (
          <p style={{ opacity: 0.6 }}>Belum ada item</p>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.id} style={styles.cartItem}>
                <span>
                  {item.nama} x {item.qty}
                </span>

                <button
                  onClick={() => removeItem(item.id)}
                  style={styles.removeBtn}
                >
                  ✕
                </button>
              </div>
            ))}

            <div style={styles.total}>
              Total: Rp {getTotal().toLocaleString("id-ID")}
            </div>

            <button onClick={checkout} style={styles.checkout}>
              Checkout
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    fontFamily: "sans-serif",
    background: "#0f172a",
    minHeight: "100vh",
    color: "#fff",
    padding: 16,
  },

  header: {
    textAlign: "center",
    marginBottom: 20,
  },

  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitle: {
    opacity: 0.6,
    fontSize: 12,
  },

  section: {
    marginBottom: 16,
  },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    outline: "none",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
    marginBottom: 120,
  },

  card: {
    background: "#1e293b",
    borderRadius: 16,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: 100,
    objectFit: "cover",
  },

  cardBody: {
    padding: 10,
  },

  productName: {
    fontSize: 14,
    margin: 0,
  },

  price: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },

  button: {
    width: "100%",
    padding: 8,
    borderRadius: 8,
    border: "none",
    background: "#22c55e",
    color: "#000",
    fontWeight: "bold",
  },

  cart: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#111827",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  removeBtn: {
    background: "red",
    border: "none",
    color: "#fff",
    borderRadius: 6,
    padding: "2px 6px",
  },

  total: {
    marginTop: 10,
    fontWeight: "bold",
  },

  checkout: {
    width: "100%",
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#facc15",
    fontWeight: "bold",
  },

  loading: {
    color: "#fff",
    textAlign: "center",
    paddingTop: 50,
  },
}
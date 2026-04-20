import { useState, useEffect } from "react"
import { db } from "../lib/firebase"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore"

import Head from "next/head"

export default function Home() {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ======================
  // LOAD MENU
  // ======================
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snap = await getDocs(collection(db, "products"))
        setMenu(snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })))
      } catch (e) {
        console.error("Gagal load menu:", e)
        alert("Gagal load menu. Coba refresh.")
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [])

  // ======================
  // CART LOGIC
  // ======================
  const addToCart = (item) => {
    if (item.stok <= 0) return alert("Stok habis")

    setCart(prev => {
      const exist = prev.find(i => i.id === item.id)

      if (exist) {
        if (exist.qty >= item.stok) {
          alert("Stok tidak cukup")
          return prev
        }

        return prev.map(i =>
          i.id === item.id
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      }

      return [...prev, { ...item, qty: 1 }]
    })
  }

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const total = cart.reduce(
    (sum, item) => sum + item.harga * item.qty,
    0
  )

  // ======================
  // ANTI DOUBLE CLICK
  // ======================
  const antiDouble = () => {
    const last = localStorage.getItem("last_order_time")
    const now = Date.now()

    if (last && now - last < 3000) {
      alert("Tunggu sebentar...")
      return false
    }

    localStorage.setItem("last_order_time", now)
    return true
  }

  // ======================
  // CHECKOUT ATOMIC (SAFE TRANSACTION)
  // ======================
  const submitOrder = async () => {
    if (cart.length === 0) return alert("Cart kosong")
    if (!antiDouble()) return
    if (isSubmitting) return

    setIsSubmitting(true)

    let nomor_antrian_final = 0

    try {
      await runTransaction(db, async (transaction) => {

        // ======================
        // 1. VALIDATE STOCK
        // ======================
        const productRefs = cart.map(item =>
          doc(db, "products", item.id)
        )

        const productSnaps = await Promise.all(
          productRefs.map(ref => transaction.get(ref))
        )

        for (let i = 0; i < cart.length; i++) {
          const snap = productSnaps[i]
          const item = cart[i]

          if (!snap.exists()) {
            throw new Error(`Produk ${item.nama} tidak ditemukan`)
          }

          if (snap.data().stok < item.qty) {
            throw new Error(`Stok ${item.nama} tidak cukup`)
          }
        }

        // ======================
        // 2. QUEUE NUMBER (ATOMIC)
        // ======================
        const queueRef = doc(db, "meta", "queue")
        const queueSnap = await transaction.get(queueRef)

        const today = new Date().toISOString().split("T")[0]

        if (!queueSnap.exists() || queueSnap.data().date !== today) {
          nomor_antrian_final = 1
          transaction.set(queueRef, {
            date: today,
            last_number: 1
          })
        } else {
          nomor_antrian_final = queueSnap.data().last_number + 1
          transaction.update(queueRef, {
            last_number: nomor_antrian_final
          })
        }

        // ======================
        // 3. REDUCE STOCK
        // ======================
        productSnaps.forEach((snap, i) => {
          const currentStock = snap.data().stok
          const qty = cart[i].qty

          transaction.update(snap.ref, {
            stok: currentStock - qty
          })
        })

        // ======================
        // 4. CREATE ORDER
        // ======================
        const orderRef = doc(collection(db, "orders"))

        transaction.set(orderRef, {
          nomor_antrian: nomor_antrian_final,
          items: cart,
          total,
          status: "pending",
          created_at: serverTimestamp(),
          no_meja: "-",
          nama_customer: "Walk-in"
        })
      })

      alert(`Order sukses! No Antrian: ${nomor_antrian_final}`)
      setCart([])

      // refresh menu
      const snap = await getDocs(collection(db, "products"))
      setMenu(snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })))

    } catch (e) {
      console.error("ORDER ERROR:", e)
      alert(e.message.includes("Stok")
        ? e.message
        : "Gagal order. Coba lagi."
      )
    }

    setIsSubmitting(false)
  }

  // ======================
  // UI
  // ======================
  if (loading) return <div style={styles.loading}>Loading menu...</div>

  return (
    <>
      <Head>
        <title>TotalGo - Fast.Fresh.Prime</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        <h2 style={styles.title}>Menu TotalGo 馃殌</h2>

        {/* MENU */}
        <div style={styles.menuGrid}>
          {menu.map(item => (
            <div key={item.id} style={styles.card(item.stok === 0)}>
              <b>{item.nama}</b>
              <div>Rp{item.harga?.toLocaleString("id-ID")}</div>
              <div>Stok: {item.stok}</div>

              <button
                onClick={() => addToCart(item)}
                disabled={item.stok === 0}
                style={styles.btn(item.stok === 0)}
              >
                {item.stok === 0 ? "Habis" : "+ Add"}
              </button>
            </div>
          ))}
        </div>

        {/* CART */}
        <h2 style={styles.title}>Keranjang</h2>

        {cart.length === 0 ? (
          <p style={{ opacity: 0.6, textAlign: "center" }}>
            Keranjang kosong
          </p>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id} style={styles.cartItem}>
                <span>{item.nama} x{item.qty}</span>
                <div>
                  Rp{(item.harga * item.qty).toLocaleString("id-ID")}
                  <button onClick={() => removeItem(item.id)} style={styles.del}>x</button>
                </div>
              </div>
            ))}

            <h3 style={styles.total}>
              Total: Rp{total.toLocaleString("id-ID")}
            </h3>
          </>
        )}

        {/* CHECKOUT */}
        <button
          onClick={submitOrder}
          disabled={isSubmitting || cart.length === 0}
          style={styles.checkout(isSubmitting || cart.length === 0)}
        >
          {isSubmitting ? "Memproses..." : "Checkout"}
        </button>
      </div>
    </>
  )
}

// ======================
// STYLES
// ======================
const styles = {
  loading: { padding: 20 },
  page: { maxWidth: 480, margin: "0 auto", padding: 16, fontFamily: "sans-serif" },
  title: { marginTop: 20, fontSize: 20 },
  menuGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  card: (disabled) => ({
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 10,
    opacity: disabled ? 0.5 : 1
  }),

  btn: (disabled) => ({
    width: "100%",
    marginTop: 5,
    padding: 8,
    background: disabled ? "#ccc" : "#000",
    color: "#fff",
    border: "none",
    borderRadius: 8
  }),

  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0"
  },

  del: {
    marginLeft: 10,
    border: "none",
    background: "#eee",
    borderRadius: 5,
    cursor: "pointer"
  },

  total: {
    textAlign: "right",
    marginTop: 10
  },

  checkout: (disabled) => ({
    width: "100%",
    padding: 14,
    marginTop: 15,
    background: disabled ? "#ccc" : "#000",
    color: "#fff",
    border: "none",
    borderRadius: 10
  })
}
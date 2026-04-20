import { useState, useEffect } from "react"
import Head from "next/head"
import { db } from "../lib/firebase"
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp
} from "firebase/firestore"

export default function Home() {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ======================
  // VARIAN HELPERS
  // ======================
  const getHarga = (item, varian) => {
    if (varian === "Lite") return item.harga_lite || 0
    if (varian === "Healthy") return item.harga_healthy || 0
    if (varian === "Sultan") return item.harga_sultan || 0
    return 0
  }

  const getStok = (item, varian) => {
    if (varian === "Lite") return item.stok_lite || 0
    if (varian === "Healthy") return item.stok_healthy || 0
    if (varian === "Sultan") return item.stok_sultan || 0
    return 0
  }

  // ======================
  // LOAD MENU
  // ======================
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snap = await getDocs(collection(db, "products"))
        setMenu(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error(e)
        alert("Gagal load menu")
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [])

  // ======================
  // CART LOGIC SAFE
  // ======================
  const addToCart = (item, varian) => {
    const stok = getStok(item, varian)
    if (stok <= 0) return alert("Stok habis")

    setCart(prev => {
      const exist = prev.find(i => i.id === item.id && i.varian === varian)

      if (exist) {
        if (exist.qty >= stok) {
          alert("Stok tidak cukup")
          return prev
        }

        return prev.map(i =>
          i.id === item.id && i.varian === varian
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      }

      return [
        ...prev,
        {
          id: item.id,
          nama: item.nama,
          varian,
          qty: 1,
          harga: getHarga(item, varian)
        }
      ]
    })
  }

  const removeItem = (id, varian) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.varian === varian)))
  }

  const total = cart.reduce((s, i) => s + i.harga * i.qty, 0)

  // ======================
  // CHECKOUT SAFE TRANSACTION
  // ======================
  const submitOrder = async () => {
    if (!cart.length) return alert("Cart kosong")
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      let nomor = 0

      await runTransaction(db, async (tx) => {
        const queueRef = doc(db, "meta", "queue")
        const snap = await tx.get(queueRef)

        const today = new Date().toISOString().split("T")[0]

        if (!snap.exists() || snap.data().date !== today) {
          nomor = 1
          tx.set(queueRef, { date: today, last_number: 1 })
        } else {
          nomor = snap.data().last_number + 1
          tx.update(queueRef, { last_number: nomor })
        }

        const orderRef = doc(collection(db, "orders"))

        tx.set(orderRef, {
          nomor_antrian: nomor,
          items: cart,
          total,
          status: "pending",
          created_at: serverTimestamp(),
          nama_customer: "Walk-in",
          no_meja: "-"
        })
      })

      alert(`Order sukses! No: ${nomor}`)
      setCart([])

      const snap = await getDocs(collection(db, "products"))
      setMenu(snap.docs.map(d => ({ id: d.id, ...d.data() })))

    } catch (err) {
      console.error(err)
      alert("Gagal order")
    }

    setIsSubmitting(false)
  }

  // ======================
  // UI
  // ======================
  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <>
      {/* PWA SAFE HEAD */}
      <Head>
        <title>TotalGo</title>
        <meta name="description" content="TotalGo Customer Order" />
        <meta name="theme-color" content="#ea580c" />
      </Head>

      <div style={styles.page}>
        <h2>Menu TotalGo</h2>

        {/* MENU */}
        <div style={styles.menuGrid}>
          {menu.map(item => (
            <div key={item.id} style={styles.card}>
              <b>{item.nama}</b>

              <div>Lite: {item.harga_lite}</div>
              <div>Healthy: {item.harga_healthy}</div>
              <div>Sultan: {item.harga_sultan}</div>

              <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                <button onClick={() => addToCart(item, "Lite")}>Lite</button>
                <button onClick={() => addToCart(item, "Healthy")}>Healthy</button>
                <button onClick={() => addToCart(item, "Sultan")}>Sultan</button>
              </div>
            </div>
          ))}
        </div>

        {/* CART */}
        <h2>Cart</h2>

        {cart.length === 0 ? (
          <p>Kosong</p>
        ) : (
          <>
            {cart.map(i => (
              <div key={i.id + i.varian} style={styles.cartItem}>
                <span>{i.nama} ({i.varian}) x{i.qty}</span>
                <span>
                  Rp{(i.harga * i.qty).toLocaleString("id-ID")}
                  <button onClick={() => removeItem(i.id, i.varian)}>x</button>
                </span>
              </div>
            ))}

            <h3>Total: Rp{total.toLocaleString("id-ID")}</h3>
          </>
        )}

        <button
          onClick={submitOrder}
          disabled={isSubmitting || !cart.length}
        >
          {isSubmitting ? "Proses..." : "Checkout"}
        </button>
      </div>
    </>
  )
}

const styles = {
  loading: { padding: 20 },
  page: { maxWidth: 480, margin: "0 auto", padding: 16 },
  menuGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  card: { padding: 10, border: "1px solid #ddd", borderRadius: 10 },
  cartItem: { display: "flex", justifyContent: "space-between", marginTop: 8 }
}

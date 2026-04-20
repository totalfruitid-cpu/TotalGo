import { useState, useEffect } from "react"
import { db } from "../lib/firebase"
import {
  collection,
  getDocs,
  doc,
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
  // HELPERS VARIAN
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
        setMenu(snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })))
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
  // CART
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
          qty: 1,
          varian,
          harga: getHarga(item, varian)
        }
      ]
    })
  }

  const removeItem = (id, varian) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.varian === varian)))
  }

  const total = cart.reduce(
    (sum, item) => sum + item.harga * item.qty,
    0
  )

  // ======================
  // CHECKOUT (NO STOCK REDUCE)
  // ======================
  const submitOrder = async () => {
    if (cart.length === 0) return alert("Cart kosong")
    if (isSubmitting) return

    setIsSubmitting(true)

    let nomor_antrian_final = 0

    try {
      await runTransaction(db, async (transaction) => {

        // QUEUE
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

        // CREATE ORDER ONLY
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

      alert(`Order sukses! No: ${nomor_antrian_final}`)
      setCart([])

      // refresh menu
      const snap = await getDocs(collection(db, "products"))
      setMenu(snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })))

    } catch (e) {
      console.error(e)
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
      <Head>
        <title>TotalGo</title>
      </Head>

      <div style={styles.page}>
        <h2 style={styles.title}>Menu</h2>

        {/* MENU */}
        <div style={styles.menuGrid}>
          {menu.map(item => (
            <div key={item.id} style={styles.card}>
              <b>{item.nama}</b>

              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Lite: Rp{item.harga_lite || 0} | Stok: {item.stok_lite || 0}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Healthy: Rp{item.harga_healthy || 0} | Stok: {item.stok_healthy || 0}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Sultan: Rp{item.harga_sultan || 0} | Stok: {item.stok_sultan || 0}
              </div>

              <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                <button onClick={() => addToCart(item, "Lite")}>Lite</button>
                <button onClick={() => addToCart(item, "Healthy")}>Healthy</button>
                <button onClick={() => addToCart(item, "Sultan")}>Sultan</button>
              </div>
            </div>
          ))}
        </div>

        {/* CART */}
        <h2 style={styles.title}>Keranjang</h2>

        {cart.length === 0 ? (
          <p style={{ opacity: 0.6 }}>Kosong</p>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id + item.varian} style={styles.cartItem}>
                <span>{item.nama} ({item.varian}) x{item.qty}</span>
                <div>
                  Rp{(item.harga * item.qty).toLocaleString("id-ID")}
                  <button onClick={() => removeItem(item.id, item.varian)}>x</button>
                </div>
              </div>
            ))}

            <h3>Total: Rp{total.toLocaleString("id-ID")}</h3>
          </>
        )}

        <button
          onClick={submitOrder}
          disabled={isSubmitting || cart.length === 0}
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
  title: { marginTop: 20 },
  menuGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  card: { padding: 10, border: "1px solid #ddd", borderRadius: 10 },
  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8
  }
}
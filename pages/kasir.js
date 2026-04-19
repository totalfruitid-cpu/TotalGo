"use client"
import { useEffect, useState, useRef } from "react"
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  increment
} from "firebase/firestore"

export default function Kasir() {
  const [session, setSession] = useState(null)
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState("pending")
  const [loading, setLoading] = useState(true)

  const prevPendingCount = useRef(0)
  const unsubOrdersRef = useRef(null)

  const playSound = () => {
    const audio = new Audio("/ding.mp3")
    audio.play().catch(() => {})
  }

  // ======================
  // AUTH
  // ======================
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login"
        return
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid))

        if (!snap.exists() || snap.data().role !== "kasir") {
          await signOut(auth)
          window.location.href = "/login"
          return
        }

        setSession(user)
      } catch (err) {
        console.error(err)
        window.location.href = "/login"
      }
    })

    return () => unsubAuth()
  }, [])

  // ======================
  // ORDERS REALTIME
  // ======================
  useEffect(() => {
    if (!session?.uid) return

    setLoading(true)

    const q = query(
      collection(db, "orders"),
      orderBy("created_at", "desc")
    )

    if (unsubOrdersRef.current) {
      unsubOrdersRef.current()
      unsubOrdersRef.current = null
    }

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))

      const pendingCount = data.filter(o =>
        !o.status || o.status === "pending"
      ).length

      if (pendingCount > prevPendingCount.current) {
        playSound()
        if (navigator.vibrate) navigator.vibrate(200)
      }

      prevPendingCount.current = pendingCount
      setOrders(data)
      setLoading(false)
    })

    unsubOrdersRef.current = unsub

    return () => {
      if (unsubOrdersRef.current) {
        unsubOrdersRef.current()
        unsubOrdersRef.current = null
      }
    }
  }, [session])

  // ======================
  // CLEANUP EXTRA (ANTI BUG MOBILE)
  // ======================
  useEffect(() => {
    return () => {
      if (unsubOrdersRef.current) {
        unsubOrdersRef.current()
        unsubOrdersRef.current = null
      }
    }
  }, [])

  // ======================
  // MARK DONE
  // ======================
  const markDone = async (order) => {
    try {
      if (!order?.id) return

      await updateDoc(doc(db, "orders", order.id), {
        status: "done",
        kasir_email: session?.email || ""
      })

      const items = order.items || []

      await Promise.all(
        items.map((item) => {
          if (!item?.id) return

          const field =
            item.varian === "Lite" ? "stok_lite" :
            item.varian === "Healthy" ? "stok_healthy" :
            item.varian === "Sultan" ? "stok_sultan" : "stok"

          return updateDoc(doc(db, "products", item.id), {
            [field]: increment(-item.qty || 0)
          })
        })
      )

    } catch (err) {
      console.error(err)
      alert("Gagal update order")
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = "/login"
  }

  // ======================
  // FILTER (CLIENT SIDE)
  // ======================
  const filteredOrders = orders.filter(order => {
    if (filter === "all") return true
    if (filter === "done") return order.status === "done"
    return !order.status || order.status === "pending"
  })

  if (loading) {
    return <div style={styles.page}>Loading...</div>
  }

  // ======================
  // UI
  // ======================
  return (
    <div style={styles.page}>
      <div style={styles.row}>
        <h2 style={styles.title}>🔥 KASIR LIVE</h2>
        <button onClick={handleLogout} style={styles.smallBtn}>
          Logout
        </button>
      </div>

      <div style={styles.filterBox}>
        <button onClick={() => setFilter("pending")} style={styles.btnFilter(filter === "pending")}>Pending</button>
        <button onClick={() => setFilter("done")} style={styles.btnFilter(filter === "done")}>Done</button>
        <button onClick={() => setFilter("all")} style={styles.btnFilter(filter === "all")}>All</button>
      </div>

      {filteredOrders.length === 0 ? (
        <p style={{ opacity: 0.6, textAlign: "center", marginTop: 40 }}>
          Tidak ada order
        </p>
      ) : (
        filteredOrders.map(order => (
          <div key={order.id} style={styles.card}>
            <div style={styles.row}>
              <div>
                <b>#{order.nomor_antrian}</b>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {order.nama_customer} - Meja {order.no_meja}
                </div>
              </div>
              <span style={styles.status(order.status)}>
                {order.status || "pending"}
              </span>
            </div>

            <div>
              {order.items?.map((item, i) => (
                <div key={i} style={styles.item}>
                  <span>{item.nama} {item.varian} x{item.qty}</span>
                  <span>
                    Rp{(item.harga * item.qty).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ ...styles.row, marginTop: 8 }}>
              <b>Total</b>
              <b>Rp{order.total?.toLocaleString("id-ID")}</b>
            </div>

            {order.status !== "done" && (
              <button onClick={() => markDone(order)} style={styles.btn}>
                ✔ SELESAIKAN
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

const styles = {
  page: {
    background: "#000",
    color: "#fff",
    minHeight: "100vh",
    padding: 12,
    fontFamily: "sans-serif",
    maxWidth: 480,
    margin: "0 auto"
  },
  title: { fontSize: 18, margin: 0 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  filterBox: { display: "flex", gap: 8, marginBottom: 12, marginTop: 12 },
  btnFilter: (active) => ({
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: active ? "#fff" : "#222",
    color: active ? "#000" : "#fff",
    fontWeight: "bold"
  }),
  card: {
    background: "#111",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    border: "1px solid #222"
  },
  status: (s) => ({
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 6,
    background: s === "done" ? "green" : "#555"
  }),
  item: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    padding: "4px 0",
    borderBottom: "1px solid #222"
  },
  btn: {
    width: "100%",
    marginTop: 10,
    padding: 14,
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 10,
    fontWeight: "bold",
    fontSize: 14
  },
  smallBtn: {
    padding: "8px 12px",
    fontSize: 12,
    background: "#333",
    color: "#fff",
    border: "none",
    borderRadius: 8
  }
}
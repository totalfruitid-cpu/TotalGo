"use client"
import { useEffect, useState, useRef } from "react"
import Head from "next/head"
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

  // ================= AUTH =================
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login"
        return
      }

      const snap = await getDoc(doc(db, "users", user.uid))

      if (!snap.exists() || snap.data().role !== "kasir") {
        await signOut(auth)
        window.location.href = "/login"
        return
      }

      setSession(user)
    })

    return () => unsubAuth()
  }, [])

  // ================= ORDERS REALTIME =================
  useEffect(() => {
    if (!session?.uid) return

    setLoading(true)

    const q = query(
      collection(db, "orders"),
      orderBy("created_at", "desc")
    )

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))

      const pendingCount = data.filter(o => !o.status || o.status === "pending").length

      if (pendingCount > prevPendingCount.current) {
        playSound()
        if (navigator.vibrate) navigator.vibrate(200)
      }

      prevPendingCount.current = pendingCount
      setOrders(data)
      setLoading(false)
    })

    unsubOrdersRef.current = unsub

    return () => unsub()
  }, [session])

  // ================= MARK DONE =================
  const markDone = async (order) => {
    await updateDoc(doc(db, "orders", order.id), {
      status: "done",
      kasir_email: session?.email || ""
    })

    await Promise.all(
      (order.items || []).map(item => {
        const field =
          item.varian === "Lite" ? "stok_lite" :
          item.varian === "Healthy" ? "stok_healthy" :
          item.varian === "Sultan" ? "stok_sultan" : "stok"

        return updateDoc(doc(db, "products", item.id), {
          [field]: increment(-item.qty)
        })
      })
    )
  }

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = "/login"
  }

  // ================= FILTER =================
  const filteredOrders = orders.filter(o => {
    if (filter === "all") return true
    if (filter === "done") return o.status === "done"
    return !o.status || o.status === "pending"
  })

  if (loading) return <div style={styles.page}>Loading...</div>

  return (
    <>
      {/* ✅ PWA HEAD FIX */}
      <Head>
        <title>Kasir TotalGo</title>
        <meta name="description" content="Dashboard kasir TotalGo" />

        <link rel="manifest" href="/manifest.kasir.json" />
        <meta name="theme-color" content="#ea580c" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Kasir TotalGo" />
      </Head>

      <div style={styles.page}>
        <div style={styles.row}>
          <h2>🔥 KASIR LIVE</h2>
          <button onClick={handleLogout} style={styles.smallBtn}>Logout</button>
        </div>

        <div style={styles.filterBox}>
          <button onClick={() => setFilter("pending")} style={styles.btnFilter(filter === "pending")}>Pending</button>
          <button onClick={() => setFilter("done")} style={styles.btnFilter(filter === "done")}>Done</button>
          <button onClick={() => setFilter("all")} style={styles.btnFilter(filter === "all")}>All</button>
        </div>

        {filteredOrders.map(order => (
          <div key={order.id} style={styles.card}>
            <div style={styles.row}>
              <b>#{order.nomor_antrian}</b>
              <span>{order.status || "pending"}</span>
            </div>

            <div>
              {order.items?.map((item, i) => (
                <div key={i} style={styles.item}>
                  <span>{item.nama} {item.varian} x{item.qty}</span>
                </div>
              ))}
            </div>

            <button onClick={() => markDone(order)} style={styles.btn}>
              SELESAIKAN
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

const styles = {
  page: { background: "#000", color: "#fff", minHeight: "100vh", padding: 12, maxWidth: 480, margin: "0 auto" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  filterBox: { display: "flex", gap: 8, margin: "12px 0" },
  btnFilter: (a) => ({
    flex: 1,
    padding: 10,
    background: a ? "#fff" : "#222",
    color: a ? "#000" : "#fff",
    borderRadius: 10
  }),
  card: { background: "#111", padding: 12, marginBottom: 10, borderRadius: 12 },
  item: { fontSize: 13, padding: 4 },
  btn: { width: "100%", marginTop: 10, padding: 12, background: "#fff", color: "#000", borderRadius: 10 },
  smallBtn: { padding: 8, background: "#333", color: "#fff", borderRadius: 8 }
}

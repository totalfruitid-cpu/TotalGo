import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore"

export default function Kasir() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState("pending")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))

    const unsub = onSnapshot(q, (snap) => {
      try {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))

        let filtered = data

        if (filter === "pending") {
          filtered = data.filter((o) => o.status === "pending")
        } else if (filter === "done") {
          filtered = data.filter((o) => o.status === "done")
        }

        setOrders(filtered)
        setLoading(false)
      } catch (err) {
        console.error("Snapshot error:", err)
        setOrders([])
        setLoading(false)
      }
    })

    return () => unsub()
  }, [filter])

  const markDone = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "done",
      })
    } catch (err) {
      console.error("Update error:", err)
      alert("Gagal update order")
    }
  }

  const safeMoney = (val) => {
    if (!val) return 0
    return Number(val).toLocaleString("id-ID")
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>KASIR LIVE</h1>

        {/* FILTER */}
        <div style={styles.filter}>
          <button onClick={() => setFilter("pending")}>Pending</button>
          <button onClick={() => setFilter("done")}>Done</button>
          <button onClick={() => setFilter("all")}>All</button>
        </div>

        {/* LOADING */}
        {loading && <p>Loading orders...</p>}

        {/* EMPTY STATE */}
        {!loading && orders.length === 0 && (
          <p style={{ opacity: 0.6 }}>Tidak ada order</p>
        )}

        {/* ORDERS */}
        {orders.map((order) => (
          <div key={order.id} style={styles.card}>
            <div style={styles.header}>
              <b>Meja {order.meja || "-"}</b>
              <span style={styles.badge}>{order.status}</span>
            </div>

            {/* ITEMS SAFE RENDER */}
            <ul style={styles.list}>
              {(order.items || []).map((item, i) => (
                <li key={i}>
                  {item.qty || 0}x {item.nama || "-"}{" "}
                  {item.variant ? `(${item.variant})` : ""}
                  {" - Rp"}
                  {safeMoney(item.harga)}
                </li>
              ))}
            </ul>

            <div style={styles.total}>
              Total: Rp {safeMoney(order.total)}
            </div>

            {order.status === "pending" && (
              <button
                style={styles.doneBtn}
                onClick={() => markDone(order.id)}
              >
                Tandai Selesai
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ================= STYLE ================= */
const styles = {
  page: {
    background: "#0f172a",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "sans-serif",
    padding: 16,
  },

  container: {
    maxWidth: 600,
    margin: "0 auto",
  },

  title: {
    textAlign: "center",
    marginBottom: 16,
  },

  filter: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },

  card: {
    background: "#1e293b",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  badge: {
    background: "#fbbf24",
    color: "#000",
    padding: "4px 8px",
    borderRadius: 8,
    fontSize: 12,
  },

  list: {
    margin: 0,
    paddingLeft: 18,
    opacity: 0.9,
  },

  total: {
    marginTop: 10,
    fontWeight: "bold",
  },

  doneBtn: {
    marginTop: 10,
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "none",
    background: "#22c55e",
    fontWeight: "bold",
    cursor: "pointer",
  },
}
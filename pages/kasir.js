import { useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase' // <-- GANTI KALO PATH LU BEDA
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/router'

export default function Kasir() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('pending')
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push('/login')
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const allOrders = snap.docs.map(doc => ({ id: doc.id,...doc.data() }))
      if (filter === 'pending') setOrders(allOrders.filter(o => o.status === 'pending'))
      else if (filter === 'done') setOrders(allOrders.filter(o => o.status === 'done'))
      else setOrders(allOrders)
    })
    return () => unsub()
  }, [user, filter])

  const handleDone = (id) => updateDoc(doc(db, 'orders', id), { status: 'done' })

  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.h1}>KASIR LIVE</h1>
            <p style={styles.email}>{user?.email}</p>
          </div>
          <button style={styles.btnLogout} onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div style={styles.btnGroup}>
          <button style={filter === 'pending'? styles.btnPrimary : styles.btnSecondary} onClick={() => setFilter('pending')}>Pending</button>
          <button style={filter === 'done'? styles.btnPrimary : styles.btnSecondary} onClick={() => setFilter('done')}>Done</button>
          <button style={filter === 'all'? styles.btnPrimary : styles.btnSecondary} onClick={() => setFilter('all')}>All</button>
        </div>

        <div style={styles.orderList}>
          {orders.length === 0? <p style={styles.empty}>Belum ada orderan {filter}</p> :
            orders.map(order => (
              <div key={order.id} style={styles.card}>
                <div style={styles.orderHeader}>
                  <b>Meja {order.meja}</b>
                  <span style={styles.badge}>{order.status}</span>
                </div>
                <p style={styles.total}>Rp{order.total?.toLocaleString('id-ID')}</p>
                <ul style={styles.itemList}>
                  {order.items?.map((item, i) => (
                    <li key={i}>{item.qty}x {item.name}</li>
                  ))}
                </ul>
                {order.status === 'pending' &&
                  <button style={styles.btnPrimary} onClick={() => handleDone(order.id)}>Tandai Selesai</button>
                }
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    background: "linear-gradient(135deg, #fef7ff, #f0f9ff 50%, #ecfdf5)",
    color: "#1e293b",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    WebkitFontSmoothing: "antialiased"
  },

  container: {
    width: "100%",
    maxWidth: 500,
    margin: "0 auto",
    padding: 16,
    boxSizing: "border-box"
  },

  loading: {
    padding: 20,
    textAlign: "center",
    color: "#475569",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fef7ff, #f0f9ff)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    padding: "12px 16px",
    borderRadius: 20,
    boxShadow: "0 4px 20px rgba(203, 213, 225, 0.25)",
    border: "1px solid rgba(255,255,255,1)",
    marginBottom: 16
  },

  h1: {
    fontSize: 20,
    margin: 0,
    color: "#0f172a",
    fontWeight: 700
  },

  email: {
    fontSize: 11,
    opacity: 0.7,
    margin: "2px 0 0 0",
    color: "#64748b"
  },

  btnGroup: {
    display: "flex",
    gap: 8,
    marginBottom: 16
  },

  btnPrimary: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #86efac, #4ade80)",
    color: "#14532d",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 4px 14px rgba(74, 222, 128, 0.35)",
    transition: "all 0.2s ease"
  },

  btnSecondary: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #bae6fd, #7dd3fc)",
    color: "#0c4a6e",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s ease"
  },

  btnLogout: {
    padding: "8px 14px",
    background: "linear-gradient(135deg, #fbcfe8, #f9a8d4)",
    color: "#831843",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    boxShadow: "0 4px 14px rgba(249, 168, 212, 0.35)"
  },

  orderList: { display: 'flex', flexDirection: 'column', gap: 12 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 40, fontSize: 14, color: '#64748b' },

  card: {
    background: "#ffffff",
    padding: 16,
    borderRadius: 20,
    boxShadow: "0 4px 16px rgba(203, 213, 225, 0.25)",
    border: "1px solid #f8fafc"
  },

  orderHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 16, alignItems: 'center' },
  badge: { fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize' },
  total: { margin: '4px 0 12px 0', fontSize: 18, fontWeight: 700, color: "#0f172a" },
  itemList: { margin: 0, paddingLeft: 18, marginBottom: 12, opacity: 0.8, fontSize: 13, color: '#334155' },

  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 12,
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    outline: "none",
    background: "#f8fafc",
    fontSize: 14,
    boxSizing: "border-box"
  },

  checkboxLabel: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
    color: "#475569",
    fontSize: 14
  }
}
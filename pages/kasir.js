import { useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase' // <-- PASTIIN PATH INI BENER
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/router'

export default function Kasir() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('pending') // pending | done | all
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push('/login')
      const token = await u.getIdTokenResult()
      if (token.claims.role!== 'kasir' && token.claims.role!== 'admin') {
        return router.push('/login')
      }
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  useEffect(() => {
    if (!user) return
    let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    if (filter === 'pending') q = query(collection(db, 'orders'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
    if (filter === 'done') q = query(collection(db, 'orders'), where('status', '==', 'done'), orderBy('createdAt', 'desc'))

    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id,...doc.data() })))
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
    background: "linear-gradient(135deg, #f1f5f9, #e0f2fe 50%, #dbeafe)",
    color: "#0f172a",
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
    background: "linear-gradient(135deg, #f1f5f9, #e0f2fe)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    padding: "12px 16px",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(148, 163, 184, 0.15)",
    border: "1px solid rgba(255,255,255,0.9)",
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
    opacity: 0.6,
    margin: "2px 0 0 0",
    color: "#475569"
  },

  btnGroup: {
    display: "flex",
    gap: 8,
    marginBottom: 16
  },

  btnPrimary: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 4px 14px rgba(34, 197, 94, 0.25)",
    transition: "all 0.2s ease"
  },

  btnSecondary: {
    flex: 1,
    padding: "12px",
    background: "#fff",
    color: "#475569",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s ease"
  },

  btnLogout: {
    padding: "8px 14px",
    background: "linear-gradient(135deg, #f87171, #ef4444)",
    color: "#fff",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    boxShadow: "0 4px 14px rgba(239, 68, 0.25)"
  },

  orderList: { display: 'flex', flexDirection: 'column', gap: 12 },
  empty: { textAlign: 'center', opacity: 0.5, marginTop: 40, fontSize: 14 },

  card: {
    background: "#ffffff",
    padding: 16,
    borderRadius: 16,
    boxShadow: "0 4px 16px rgba(148, 163, 184, 0.12)",
    border: "1px solid #f1f5f9"
  },

  orderHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 16, alignItems: 'center' },
  badge: { fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize' },
  total: { margin: '4px 0 12px 0', fontSize: 18, fontWeight: 700, color: "#0f172a" },
  itemList: { margin: 0, paddingLeft: 18, marginBottom: 12, opacity: 0.7, fontSize: 13 },

  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 12,
    borderRadius: 12,
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
// pages/kasir.js
import { useEffect, useState, useRef } from "react"
import { onAuthStateChanged, getIdTokenResult, signOut } from "firebase/auth"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import { useRouter } from "next/router"

export default function Kasir() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false) // ganti nama biar umum
  const audioRef = useRef(null)
  const prevIdsRef = useRef([])
  const router = useRouter()

  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3")
    let unsubSnapshot = null

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubSnapshot) {
        unsubSnapshot()
        unsubSnapshot = null
      }

      if (!user) {
        router.push("/login")
        return
      }

      try {
        const token = await getIdTokenResult(user)
        const userRole = token.claims.role
        console.log("ROLE USER:", userRole)

        // FIX: Boleh kasir ATAU admin
        if (userRole!== "kasir" && userRole!== "admin") {
          alert("Akses ditolak. Akun ini bukan kasir/admin.")
          await signOut(auth)
          setLoading(false) // <-- WAJIB BIAR GAK STUCK
          return
        }

        setHasAccess(true)
        setLoading(true)

        const q = query(
          collection(db, "orders"),
          where("status", "==", "pending"),
          orderBy("waktu", "desc")
        )

        unsubSnapshot = onSnapshot(q, (snap) => {
          const data = snap.docs.map(d => ({ id: d.id,...d.data() }))
          const newIds = data.map(d => d.id)

          if (prevIdsRef.current.length > 0) {
            const hasNew = newIds.some(id =>!prevIdsRef.current.includes(id))
            if (hasNew) {
              audioRef.current?.play().catch(() => {})
            }
          }

          prevIdsRef.current = newIds
          setOrders(data)
          setLoading(false)
        }, (err) => {
          console.error("GAGAL LISTEN:", err.code, err.message)
          setLoading(false)
        })

      } catch (e) {
        console.error("Gagal cek token:", e)
        await signOut(auth)
        setLoading(false) // <-- FIX: Tambah ini biar gak stuck kalo token error
      }
    })

    return () => {
      if (unsubSnapshot) unsubSnapshot()
      unsubAuth()
    }
  }, [router])

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  if (loading) return <div style={{ padding: 40 }}>Cek akses...</div>
  if (!hasAccess) return null

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard Kasir</h1>
      <button onClick={handleLogout}>Logout</button>
      {orders.length === 0? <p>Belum ada order pending</p> : null}
      {orders.map(o => (
        <div key={o.id} style={{ border: "1px solid #ccc", padding: 10, margin: 10, borderRadius: 8 }}>
          <b>{o.nama}</b> - {o.noHp}
          <p style={{ margin: "4px 0" }}>{o.alamat}</p>
          {o.items.map((i, idx) => <p key={idx} style={{ margin: 0, fontSize: 14 }}>{i.name} x{i.qty} - {i.varian}</p>)}
          <b>Total: {o.grandTotal}</b>
        </div>
      ))}
    </div>
  )
}
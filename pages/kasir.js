// pages/kasir.js
import { useEffect, useState, useRef } from "react"
import { onAuthStateChanged, getIdTokenResult, signOut } from "firebase/auth"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import { useRouter } from "next/router"

export default function Kasir() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isKasir, setIsKasir] = useState(false)
  const audioRef = useRef(null)
  const prevIdsRef = useRef([]) // <-- FIX 3: Pake ref buat track order lama
  const router = useRouter()

  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3")
    let unsubSnapshot = null // <-- FIX 1: Declare di luar biar bisa di-cleanup

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      // Kalo logout atau belum login, matiin listener lama dulu
      if (unsubSnapshot) {
        unsubSnapshot()
        unsubSnapshot = null
      }

      if (!user) {
        router.push("/login")
        return
      }

      try {
        // Cek role dari token yg fresh
        const token = await getIdTokenResult(user)
        if (token.claims.role!== "kasir") {
          alert("Akses ditolak. Akun ini bukan kasir.")
          await signOut(auth)
          return
        }

        setIsKasir(true)
        setLoading(true)

        const q = query(
          collection(db, "orders"),
          where("status", "==", "pending"),
          orderBy("waktu", "desc")
        )

        unsubSnapshot = onSnapshot(q, (snap) => {
          const data = snap.docs.map(d => ({ id: d.id,...d.data() }))
          const newIds = data.map(d => d.id)

          // FIX 3: Logic ding yg gak stale
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
      }
    })

    // FIX 1: Cleanup yg bener
    return () => {
      if (unsubSnapshot) unsubSnapshot()
      unsubAuth()
    }
  }, [router]) // <-- FIX 2: Hapus orders.length biar gak re-subscribe terus

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  if (loading) return <div style={{ padding: 40 }}>Cek akses kasir...</div>
  if (!isKasir) return null

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
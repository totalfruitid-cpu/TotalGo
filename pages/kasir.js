// pages/kasir.js
import { useEffect, useState, useRef } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore"
import { auth, db } from "../lib/firebase"

export default function Kasir() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const prevOrderCount = useRef(0)
  const audioRef = useRef(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  const unlockAudio = async () => {
    if (!audioRef.current || audioUnlocked) return
    try {
      audioRef.current.muted = true
      await audioRef.current.play()
      audioRef.current.pause()
      audioRef.current.muted = false
      audioRef.current.currentTime = 0
      setAudioUnlocked(true)
      alert("Suara notif aktif! ✅")
    } catch (e) {
      console.error("Gagal unlock:", e)
      alert("Gagal aktifin suara. Cek volume HP & file /ding.mp3. Error: " + e.message)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = "/login"
  }

  useEffect(() => {
    audioRef.current = new Audio("/ding.mp3")
    audioRef.current.load()
    audioRef.current.volume = 1.0

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists() && userDoc.data().role === "kasir") {
          setRole("kasir")

          const q = query(
            collection(db, "orders"),
            where("status", "==", "pending"),
            orderBy("waktu", "desc")
          )

          const unsubOrders = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))

            if (prevOrderCount.current !== 0 && data.length > prevOrderCount.current) {
              if (audioUnlocked) {
                audioRef.current.currentTime = 0
                audioRef.current.play().catch(e => console.log("Gagal play:", e))
              } else {
                if (navigator.vibrate) navigator.vibrate([300, 100, 300])
                alert("🔔 ORDER BARU! TAPI SUARA MASIH OFF. KLIK TOMBOL MERAH!")
              }
            }

            prevOrderCount.current = data.length
            setOrders(data)
            setLoading(false)
          })

          return () => unsubOrders()
        } else {
          window.location.href = "/login"
        }
      } else {
        window.location.href = "/login"
      }
    })
    return () => unsubscribe()
  }, [audioUnlocked])

  const handleSelesai = async (id) => {
    unlockAudio()
    try {
      await updateDoc(doc(db, "orders", id), { status: "Selesai" })
    } catch (err) {
      alert("Gagal update: " + err.message)
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>
  if (role !== "kasir") return <div style={{ padding: 20 }}>403 Forbidden</div>

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, minHeight: '100vh', fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Kasir Page</h1>
        <button 
          onClick={handleLogout}
          style={{ padding: "8px 16px", background: "#f44336", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          Logout
        </button>
      </div>

      <p>Login sebagai: {user?.email}</p>

      <button
        onClick={unlockAudio}
        style={{
          padding: 15,
          fontSize: 18,
          background: audioUnlocked ? 'green' : 'red',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          marginBottom: 10,
          width: '100%',
          cursor: "pointer"
        }}
      >
        {audioUnlocked ? '✅ Suara Aktif' : '🔔 KLIK BIAR BUNYI'}
      </button>

      {!audioUnlocked &&
        <p style={{color: 'red', fontWeight: 'bold', textAlign: 'center', marginTop: 0}}>
          ↑ WAJIB KLIK TOMBOL DI ATAS BIAR BISA DING
        </p>
      }

      <h2>Orderan Masuk:</h2>
      {orders.length === 0 ? (
        <p>Belum ada orderan Pending</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={{ border: "1px solid #ddd", marginBottom: 12, padding: 12, borderRadius: 8 }}>
            <p style={{ margin: "0 0 8px 0" }}><b>Nama:</b> {order.nama}</p>
            <p style={{ margin: "0 0 8px 0" }}><b>No HP:</b> {order.noHp}</p>
            <p style={{ margin: "0 0 8px 0" }}><b>Alamat:</b> {order.alamat}</p>
            <p style={{ margin: "0 0 8px 0" }}><b>Total:</b> Rp{order.grandTotal?.toLocaleString("id-ID") || order.total?.toLocaleString("id-ID")}</p>
            <p style={{ margin: "0 0 8px 0" }}><b>Metode:</b> {order.metode}</p>
            <p style={{ margin: "0 0 8px 0" }}><b>Waktu:</b> {order.waktu?.toDate?.()?.toLocaleString("id-ID")}</p>
            <div style={{ margin: "0 0 8px 0" }}>
              <b>Items:</b>
              <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                {order.items?.map((item, idx) => (
                  <li key={idx}>
                    {item.nama} - {item.qty}x {item.varian ? `- ${item.varian}` : ''} - Rp{item.harga?.toLocaleString("id-ID")}
                  </li>
                ))}
              </ul>
            </div>
            <button 
              onClick={() => handleSelesai(order.id)}
              style={{ width: "100%", padding: 10, background: "#2196F3", color: "white", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 8 }}
            >
              Tandai Selesai
            </button>
          </div>
        ))
      )}
    </div>
  )
}
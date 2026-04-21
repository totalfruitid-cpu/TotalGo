// pages/kasir.js - VERSI DING.MP3 LOKAL
import { useEffect, useState, useRef } from "react"
import { onAuthStateChanged } from "firebase/auth"
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

  const unlockAudio = () => {
    if (audioRef.current &&!audioUnlocked) {
      audioRef.current.muted = true
      audioRef.current.play().then(() => {
        audioRef.current.pause()
        audioRef.current.muted = false
        audioRef.current.currentTime = 0
        setAudioUnlocked(true)
      }).catch(e => console.log("Gagal unlock:", e))
    }
  }

  useEffect(() => {
    // PAKE FILE LOKAL DARI /public/ding.mp3
    audioRef.current = new Audio("/ding.mp3")
    audioRef.current.load()
    audioRef.current.volume = 1.0 // VOLUME MAX

    document.addEventListener('click', unlockAudio, { once: true })

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

            if (prevOrderCount.current!== 0 && data.length > prevOrderCount.current) {
              if (audioUnlocked) {
                audioRef.current.currentTime = 0 // Reset biar bisa bunyi berkali2
                audioRef.current.play().catch(e => console.log("Gagal play:", e))
              } else {
                if (navigator.vibrate) navigator.vibrate([200, 100, 200])
                alert("🔔 ORDER BARU MASUK! Klik OK + tap layar buat aktifin suara")
              }
            }

            prevOrderCount.current = data.length
            setOrders(data)
            setLoading(false)
          }, (err) => {
            console.error(err)
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
    return () => {
      unsubscribe()
      document.removeEventListener('click', unlockAudio)
    }
  }, [audioUnlocked])

  const handleSelesai = async (id) => {
    unlockAudio()
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "Selesai"
      })
    } catch (err) {
      alert("Gagal update: " + err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (role!== "kasir") return <div>403 Forbidden</div>

  return (
    <div style={{ padding: 20 }} onClick={unlockAudio}>
      <h1>Kasir Page</h1>
      <p>Login sebagai: {user?.email}</p>
      <button onClick={unlockAudio}>Test Suara Ding</button>
      {!audioUnlocked &&
        <p style={{color: 'red', fontWeight: 'bold'}}>
          Klik tombol "Test Suara Ding" atau tap layar 1x dulu biar notif bunyi
        </p>
      }

      <h2>Orderan Masuk:</h2>
      {orders.length === 0? (
        <p>Belum ada orderan Pending</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
            <p><b>Nama:</b> {order.nama}</p>
            <p><b>No HP:</b> {order.noHp}</p>
            <p><b>Alamat:</b> {order.alamat}</p>
            <p><b>Total:</b> Rp{order.grandTotal?.toLocaleString("id-ID")}</p>
            <p><b>Metode:</b> {order.metode}</p>
            <p><b>Waktu:</b> {order.waktu?.toDate?.()?.toLocaleString("id-ID")}</p>
            <p><b>Items:</b></p>
            <ul>
              {order.items?.map((item, idx) => (
                <li key={idx}>
                  {item.nama} - {item.qty}x - {item.varian} - Rp{item.harga?.toLocaleString("id-ID")}
                </li>
              ))}
            </ul>
            <button onClick={() => handleSelesai(order.id)}>
              Tandai Selesai
            </button>
          </div>
        ))
      )}
    </div>
  )
}
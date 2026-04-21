// pages/kasir.js - FINAL PAKE INDEX
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
  const [interacted, setInteracted] = useState(false)

  useEffect(() => {
    // Siapin audio ding
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
    audioRef.current.load()

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists() && userDoc.data().role === "kasir") {
          setRole("kasir")

          // PAKE orderBy KARENA INDEX LU UDAH JADI
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

            // BUNYIIN DING KALO ADA ORDER BARU NONGOL
            if (prevOrderCount.current!== 0 && data.length > prevOrderCount.current) {
              if (interacted) {
                audioRef.current?.play().catch(e => console.log("Gagal play:", e))
              } else {
                alert("Order baru masuk! Klik OK buat aktifin suara notif")
                setInteracted(true)
              }
            }

            prevOrderCount.current = data.length
            setOrders(data)
            setLoading(false)
          }, (err) => {
            console.error(err)
            alert("Gagal ambil data: " + err.message + ". Cek index udah Enabled belum.")
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
  }, [interacted])

  const handleSelesai = async (id) => {
    setInteracted(true) // Biar suara bisa bunyi abis klik tombol
    try {
      await updateDoc(doc(db, "orders", id), {
        status: "Selesai"
      })
    } catch (err) {
      alert("Gagal update: " + err.message)
    }
  }

  const testDing = () => {
    setInteracted(true)
    audioRef.current?.play()
  }

  if (loading) return <div>Loading...</div>
  if (role!== "kasir") return <div>403 Forbidden</div>

  return (
    <div style={{ padding: 20 }} onClick={() => setInteracted(true)}>
      <h1>Kasir Page</h1>
      <p>Login sebagai: {user?.email}</p>
      <button onClick={testDing}>Test Suara Ding</button>
      {!interacted && <p style={{color: 'red'}}>Klik dimana aja dulu biar suara notif aktif</p>}

      <h2>Orderan Masuk:</h2>
      {orders.length === 0? (
        <p>Belum ada orderan Pending</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
            <p><b>Nama:</b> {order.nama}</p>
            <p><b>Alamat:</b> {order.alamat}</p>
            <p><b>No HP:</b> {order.noHp}</p>
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
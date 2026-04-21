import { useEffect, useState } from "react"
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists() && userDoc.data().role === "kasir") {
          setRole("kasir")
          
          // QUERY SESUAI DATA LU: status "Pending" + orderBy "waktu"
          const q = query(
            collection(db, "orders"),
            where("status", "==", "Pending"),
            orderBy("waktu", "desc")
          )
          
          const unsubOrders = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
            }))
            setOrders(data)
            setLoading(false)
          }, (err) => {
            console.error(err)
            alert("Gagal ambil data: " + err.message)
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
  }, [])

  const handleSelesai = async (id) => {
    try {
      // Kalo udah selesai, ganti status jadi "Selesai"
      await updateDoc(doc(db, "orders", id), {
        status: "Selesai"
      })
    } catch (err) {
      alert("Gagal update: " + err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (role !== "kasir") return <div>403 Forbidden</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>Kasir Page</h1>
      <p>Login sebagai: {user?.email}</p>
      
      <h2>Orderan Masuk:</h2>
      {orders.length === 0 ? (
        <p>Belum ada orderan Pending</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
            <p><b>Nama:</b> {order.nama}</p>
            <p><b>Queue:</b> {order.queue}</p>
            <p><b>Total:</b> Rp{order.total}</p>
            <p><b>Metode:</b> {order.metode}</p>
            <p><b>Waktu:</b> {order.waktu}</p>
            <p><b>Items:</b></p>
            <ul>
              {order.items?.map((item, idx) => (
                <li key={idx}>
                  {item.nama} - {item.qty}x - {item.variant} - Rp{item.harga}
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
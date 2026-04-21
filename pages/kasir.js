'use client'

import { useEffect, useState } from "react"
import { db, auth } from "../lib/firebase"
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from "firebase/firestore"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"

export default function Kasir() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState("khasbullah22@gmail.com") // Email lu
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Cek status login Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Dengerin orderan kalo udah login
  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "orders"), where("status", "==", "baru"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }))
      setOrders(data)
    }, (err) => {
      console.error("Error:", err)
      setError("Gagal ambil data. Cek Rules & Index Firestore bos.")
    })
    return () => unsubscribe()
  }, [user])

  const handleLogin = async () => {
    try {
      setError("")
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError("Email / Password salah bos.")
      console.error(err)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
  }

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: status })
    } catch (err) {
      setError("Gagal update status. Cek Rules Firebase.")
    }
  }

  // HALAMAN LOADING
  if (loading) return <div style={{padding: 20, fontSize: 24, color: "white", background: "#1f2937", height: "100vh"}}>Loading...</div>

  // HALAMAN LOGIN KALO BELUM LOGIN
  if (!user) {
    return (
      <>
        <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'); body { font-family: 'Poppins', sans-serif; background: #1f2937; margin: 0; }`}</style>
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
          <div style={{background: "white", padding: 24, borderRadius: 16, width: 320, textAlign: "center"}}>
            <h1 style={{margin: "0 0 16px"}}>🔒 Login Kasir</h1>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12, boxSizing: "border-box"}}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              style={{width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12, boxSizing: "border-box"}}
            />
            <button onClick={handleLogin} style={{width: "100%", background: "#f97316", color: "white", border: "none", padding: 12, borderRadius: 8, fontWeight: 700, cursor: "pointer"}}>MASUK</button>
            {error && <p style={{color: "red", marginTop: 12, fontSize: 14}}>{error}</p>}
          </div>
        </div>
      </>
    )
  }

  // HALAMAN KASIR KALO UDAH LOGIN
  return (
    <>
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'); body { font-family: 'Poppins', sans-serif; background: #f0f2f5; margin: 0; }`}</style>
      <div style={{maxWidth: 800, margin: "0 auto", padding: 16}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <h1 style={{fontSize: 28, fontWeight: 700}}>📦 Kasir TotalGo</h1>
          <button onClick={handleLogout} style={{background: "#ef4444", color: "white", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer"}}>Logout</button>
        </div>
        <p style={{color: "#6b7280", marginTop: -8}}>Login sebagai: {user.email}</p>
        <h2 style={{color: "#6b7280"}}>Orderan Masuk: {orders.length}</h2>
        {error && <p style={{color: "red", background: "#fee2e2", padding: 12, borderRadius: 8}}>{error}</p>}
        {orders.length === 0? (
          <p style={{textAlign: "center", padding: 40, color: "#6b7280"}}>Belum ada orderan baru bos. Santai dulu.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} style={{background: "white", padding: 16, borderRadius: 12, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.1)"}}>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                <b>{o.nama} - {o.noHp}</b>
                <b style={{color: "#ea580c"}}>Rp{o.grandTotal?.toLocaleString("id-ID")}</b>
              </div>
              <p style={{margin: "4px 0", color: "#4b5563"}}>{o.alamat}</p>
              <p style={{margin: "4px 0 12px", fontSize: 12, color: "#6b7280"}}>Metode: {o.metode}</p>
              <div style={{borderTop: "1px dashed #e5e7eb", paddingTop: 12}}>
                {o.items?.map((item, i) => (
                  <div key={i} style={{display: "flex", justifyContent: "space-between", marginBottom: 4}}>
                    <span>{item.nama} {item.varian} x{item.qty}</span>
                    <span>Rp{(item.harga * item.qty).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
              <div style={{display: "flex", gap: 8, marginTop: 16}}>
                <button onClick={() => updateStatus(o.id, "diproses")} style={{flex: 1, background: "#f59e0b", color: "white", border: "none", padding: 10, borderRadius: 8, fontWeight: 600, cursor: "pointer"}}>PROSES</button>
                <button onClick={() => updateStatus(o.id, "selesai")} style={{flex: 1, background: "#22c55e", color: "white", border: "none", padding: 10, borderRadius: 8, fontWeight: 600, cursor: "pointer"}}>SELESAI</button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
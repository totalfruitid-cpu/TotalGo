// pages/kasir.js - HALAMAN KASIR TOTALGO
import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from "firebase/firestore"

export default function Kasir() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Dengerin order baru realtime
    const q = query(collection(db, "orders"), where("status", "==", "baru"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setOrders(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status: status })
  }

  if (loading) return <div style={{padding: 20, fontSize: 24}}>Nunggu orderan masuk...</div>

  return (
    <>
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'); body { font-family: 'Poppins', sans-serif; background: #f0f2f5; margin: 0; }`}</style>
      <div style={{maxWidth: 800, margin: "0 auto", padding: 16}}>
        <h1 style={{fontSize: 28, fontWeight: 700}}>📦 Kasir TotalGo</h1>
        <h2 style={{color: "#6b7280"}}>Orderan Masuk: {orders.length}</h2>
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
"use client" // wajib kalo pake useState
import { useState } from "react"
import { db } from "../lib/firebase" // sesuaikan path firebase lu
import { doc, collection, runTransaction, setDoc, serverTimestamp } from "firebase/firestore"

export default function Home() {
  const [cart, setCart] = useState([])
  const [namaCustomer, setNamaCustomer] = useState("")
  const [noMeja, setNoMeja] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Keranjang kosong")
    if (!namaCustomer.trim()) return alert("Isi nama customer dulu")
    if (!noMeja.trim()) return alert("Isi nomor meja dulu")

    setLoading(true)
    try {
      const orderRef = doc(collection(db, "orders"))
      const queueRef = doc(db, "meta", "queue")
      const total = cart.reduce((sum, item) => sum + item.harga * item.qty, 0)

      const noAntrian = await runTransaction(db, async (tx) => {
        const snap = await tx.get(queueRef)
        const today = new Date().toISOString().split("T")[0]

        if (!snap.exists()) {
          tx.set(queueRef, { date: today, last_number: 1 })
          return 1
        } else {
          const data = snap.data()
          if (data.date === today) {
            const newNum = data.last_number + 1
            tx.update(queueRef, { last_number: newNum })
            return newNum
          } else {
            tx.set(queueRef, { date: today, last_number: 1 })
            return 1
          }
        }
      })

      await setDoc(orderRef, {
        items: cart.map(item => ({
          id: item.id,
          nama: item.nama,
          harga: item.harga,
          qty: item.qty,
          variant: item.variant || null
        })),
        total,
        created_at: serverTimestamp(),
        nomor_antrian: noAntrian,
        status: "pending",
        no_meja: noMeja,
        nama_customer: namaCustomer
      })

      alert(`Order sukses! Nomor antrian: ${noAntrian}`)
      setCart([])
      setNamaCustomer("")
      setNoMeja("")

    } catch (err) {
      console.error("FIREBASE ERROR:", err)
      alert("Gagal order: " + err.code + "\n" + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Halaman Kasir TotalGo</h1>
      {/* Tambahin UI lu di sini bos */}
      <button onClick={handleCheckout} disabled={loading}>
        {loading? "Proses..." : "Checkout"}
      </button>
    </div>
  )
}
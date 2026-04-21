import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [table, setTable] = useState("")
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "products"))
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error("LOAD ERROR:", err)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (p, variant) => {
    const price =
      variant === "lite" ? p.harga_lite :
      variant === "healthy" ? p.harga_healthy :
      p.harga_sultan

    setCart(prev => {
      const exist = prev.find(i => i.id === p.id && i.variant === variant)

      if (exist) {
        return prev.map(i =>
          i.id === p.id && i.variant === variant
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      }

      return [
        ...prev,
        {
          id: p.id,
          nama: p.nama || "Unknown",
          variant,
          harga: Number(price || 0),
          qty: 1
        }
      ]
    })
  }

  const checkout = async () => {
    try {
      if (!table || table.trim() === "") {
        alert("Isi nomor meja")
        return
      }

      if (!cart || cart.length === 0) {
        alert("Cart kosong")
        return
      }

      setCheckingOut(true)

      // ================= SAFE ITEMS =================
      const items = cart.map(item => ({
        nama: String(item.nama || ""),
        variant: String(item.variant || "lite"),
        qty: Number(item.qty || 1),
        harga: Number(item.harga || 0)
      }))

      const total = items.reduce((a, b) => a + b.harga * b.qty, 0)

      // ================= QUEUE SAFE =================
      const today = new Date().toISOString().split("T")[0]
      const queueRef = doc(db, "meta", "queue")

      let nomor_antrian = 1

      try {
        const snap = await getDoc(queueRef)

        if (!snap.exists()) {
          await setDoc(queueRef, {
            date: today,
            last_number: 1
          })
          nomor_antrian = 1
        } else {
          const data = snap.data()

          if (data.date === today) {
            nomor_antrian = data.last_number + 1

            await updateDoc(queueRef, {
              last_number: nomor_antrian
            })
          } else {
            await setDoc(queueRef, {
              date: today,
              last_number: 1
            })
            nomor_antrian = 1
          }
        }
      } catch (err) {
        console.error("QUEUE ERROR:", err)
        nomor_antrian = Date.now() // fallback
      }

      // ================= PAYLOAD SESUAI RULES =================
      const payload = {
        items,
        total: Number(total),
        created_at: Date.now(),
        nomor_antrian: Number(nomor_antrian),
        status: "pending",
        no_meja: String(table),
        nama_customer: "Guest"
      }

      console.log("ORDER:", payload)

      await addDoc(collection(db, "orders"), payload)

      setCart([])
      setTable("")

      alert(`Order berhasil! No: ${nomor_antrian}`)

    } catch (err) {
      console.error("CHECKOUT ERROR:", err)
      alert("Checkout gagal: " + err.message)
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>STORE</h1>

      <input
        placeholder="No Meja"
        value={table}
        onChange={(e) => setTable(e.target.value)}
      />

      <div>
        {products.map(p => (
          <div key={p.id}>
            <h3>{p.nama}</h3>

            <button onClick={() => addToCart(p, "lite")}>
              Lite ({p.harga_lite})
            </button>

            <button onClick={() => addToCart(p, "healthy")}>
              Healthy ({p.harga_healthy})
            </button>

            <button onClick={() => addToCart(p, "sultan")}>
              Sultan ({p.harga_sultan})
            </button>
          </div>
        ))}
      </div>

      <h2>Cart</h2>
      {cart.map((c, i) => (
        <div key={i}>
          {c.qty}x {c.nama} ({c.variant})
        </div>
      ))}

      <button onClick={checkout} disabled={checkingOut}>
        {checkingOut ? "Processing..." : "Checkout"}
      </button>
    </div>
  )
}
import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)

  const [nama, setNama] = useState("")
  const [metode, setMetode] = useState("Ambil di Tempat")
  const [alamat, setAlamat] = useState("")
  const [noHp, setNoHp] = useState("")

  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"))
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
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

      return [...prev, {
        id: p.id,
        nama: p.nama,
        variant,
        harga: Number(price || 0),
        qty: 1
      }]
    })
  }

  const checkout = async () => {
    try {
      if (!nama.trim()) return alert("Nama wajib")

      if (cart.length === 0) return alert("Cart kosong")

      if (metode === "COD") {
        if (!alamat.trim() || !noHp.trim()) {
          return alert("COD wajib alamat & no HP")
        }
      }

      setCheckingOut(true)

      const items = cart.map(i => ({
        nama: i.nama,
        variant: i.variant,
        qty: i.qty,
        harga: i.harga
      }))

      const total = items.reduce((a, b) => a + b.harga * b.qty, 0)

      await addDoc(collection(db, "orders"), {
        nama: nama.trim(),
        metode,
        alamat: metode === "COD" ? alamat : "",
        no_hp: metode === "COD" ? noHp : "",
        items,
        total,
        queue: "TRX-" + Date.now(),
        status: "Pending",
        waktu: new Date().toISOString()
      })

      setCart([])
      setNama("")
      setAlamat("")
      setNoHp("")

      alert("Order masuk")
    } catch (err) {
      alert("Gagal: " + err.message)
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>STORE</h1>

      <input placeholder="Nama" value={nama} onChange={e => setNama(e.target.value)} />

      <select value={metode} onChange={e => setMetode(e.target.value)}>
        <option>Ambil di Tempat</option>
        <option>COD</option>
        <option>QRIS</option>
      </select>

      {metode === "COD" && (
        <>
          <input placeholder="Alamat" value={alamat} onChange={e => setAlamat(e.target.value)} />
          <input placeholder="No HP" value={noHp} onChange={e => setNoHp(e.target.value)} />
        </>
      )}

      <hr />

      {products.map(p => (
        <div key={p.id}>
          <h3>{p.nama}</h3>
          <button onClick={() => addToCart(p, "lite")}>Lite ({p.harga_lite})</button>
          <button onClick={() => addToCart(p, "healthy")}>Healthy ({p.harga_healthy})</button>
          <button onClick={() => addToCart(p, "sultan")}>Sultan ({p.harga_sultan})</button>
        </div>
      ))}

      <h2>Cart</h2>
      {cart.map((c, i) => (
        <div key={i}>{c.qty}x {c.nama} ({c.variant})</div>
      ))}

      <button onClick={checkout} disabled={checkingOut}>
        {checkingOut ? "Processing..." : "Checkout"}
      </button>
    </div>
  )
}
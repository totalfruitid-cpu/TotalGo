// pages/store.js
import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})

  const [nama, setNama] = useState("")
  const [alamat, setAlamat] = useState("")
  const [noHp, setNoHp] = useState("")
  const [metode, setMetode] = useState("COD")

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, "products"), orderBy("nama"))
      const snap = await getDocs(q)
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    fetch()
  }, [])

  const total = Object.values(cart).reduce((a, b) => a + b.harga * b.qty, 0)
  const ongkir = metode === "COD" ? 5000 : 0
  const grandTotal = total + ongkir

  const checkout = async () => {
    if (!nama || !alamat || !noHp) return alert("Isi data dulu")
    if (Object.keys(cart).length === 0) return alert("Keranjang kosong")

    const items = Object.values(cart)

    const docRef = await addDoc(collection(db, "orders"), {
      nama,
      alamat,
      noHp,
      items,
      total,
      ongkir,
      grandTotal,
      metode,
      status: "pending",
      waktu: serverTimestamp()
    })

    window.location.href = `/Sukses?orderId=${docRef.id}`
  }

  return (
    <div>
      <h1>STORE</h1>
      {products.map(p => (
        <button key={p.id} onClick={() => {
          setCart(prev => ({
            ...prev,
            [p.id]: { ...p, qty: (prev[p.id]?.qty || 0) + 1 }
          }))
        }}>
          {p.nama}
        </button>
      ))}

      <h3>Total: {grandTotal}</h3>

      <input placeholder="nama" onChange={e => setNama(e.target.value)} />
      <input placeholder="alamat" onChange={e => setAlamat(e.target.value)} />
      <input placeholder="no hp" onChange={e => setNoHp(e.target.value)} />

      <button onClick={checkout}>CHECKOUT</button>
    </div>
  )
}
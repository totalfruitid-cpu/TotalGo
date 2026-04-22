// pages/store.js
import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [selectedVarian, setSelectedVarian] = useState({})

  const [nama, setNama] = useState("")
  const [alamat, setAlamat] = useState("")
  const [noHp, setNoHp] = useState("")
  const [metode, setMetode] = useState("COD")

  const [loading, setLoading] = useState(false)

  // Format duit biar gak RpNaN
  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(Number(value) || 0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "products"))
        const data = snap.docs.map(doc => {
          const p = doc.data()
          // Paksa harga jadi Number dari DB
          const baseHarga = Number(p.harga) || 0

          return {
            id: doc.id,
            nama: p.nama,
            img: p.img || "https://placehold.co/300x200",
            // Pastiin semua varian.harga juga Number
            varian: p.varian?.length > 0
             ? p.varian.map(v => ({...v, harga: Number(v.harga) || 0 }))
              : [
                  { nama: "Lite Healthy", harga: baseHarga },
                  { nama: "Regular", harga: baseHarga + 3000 },
                  { nama: "Sultan", harga: baseHarga + 7000 }
                ]
          }
        })
        setProducts(data)
      } catch (err) {
        console.error("Gagal load products:", err)
        alert("Gagal ambil data produk")
      }
    }
    fetchData()
  }, [])

  const addToCart = (product) => {
    const index = selectedVarian[product.id] || 0
    const v = product.varian[index]
    const key = `${product.id}_${v.nama}`

    setCart(prev => {
      const qty = prev[key]?.qty || 0
      return {
       ...prev,
        [key]: {
          id: product.id,
          nama: product.nama,
          varian: v.nama,
          harga: Number(v.harga) || 0, // Paksa Number pas masuk cart
          img: product.img,
          qty: qty + 1
        }
      }
    })
  }

  const updateQty = (key, delta) => {
    setCart(prev => {
      const item = prev[key]
      if (!item) return prev
      const newQty = item.qty + delta
      if (newQty <= 0) {
        const { [key]: _,...rest } = prev
        return rest
      }
      return {...prev, [key]: {...item, qty: newQty } }
    })
  }

  const total = Object.values(cart).reduce(
    (sum, item) => sum + (Number(item.harga) || 0) * (Number(item.qty) || 0),
    0
  )

  const checkout = async () => {
    if (!nama ||!alamat ||!noHp) {
      return alert("Lengkapi nama, alamat, no HP!")
    }
    if (!/^[0-9]{10,15}$/.test(noHp)) {
      return alert("No HP harus 10-15 angka, tanpa +62 atau spasi")
    }

    // Mapping biar 100% cocok sama Rules Firestore
    const itemsToSend = Object.values(cart).map(item => ({
      name: item.nama, // nama -> name
      price: Number(item.harga) || 0, // harga -> price, paksa Number
      qty: Number(item.qty) || 0, // paksa Number
      varian: item.varian
      // id & img sengaja dibuang biar lolos hasOnly()
    }))

    if (itemsToSend.length === 0) {
      return alert("Keranjang kosong!")
    }

    const finalTotal = Number(total) || 0
    if (finalTotal === 0) {
      return alert("Total gak boleh 0 bos!")
    }

    try {
      setLoading(true)

      await addDoc(collection(db, "orders"), {
        nama,
        alamat,
        noHp,
        items: itemsToSend,
        total: finalTotal,
        grandTotal: finalTotal,
        metode,
        status: "pending",
        waktu: serverTimestamp()
      })

      alert("Order berhasil dikirim ke kasir!")
      setCart({})
      setNama("")
      setAlamat("")
      setNoHp("")
      setMetode("COD")

    } catch (err) {
      console.error("Checkout error:", err)
      alert("Gagal order: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", background: "#f6f6f6", minHeight: "100vh" }}>
      <h1>🍹 TOTALGO STORE</h1>

      {/* PRODUCTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: "#fff", padding: 10, borderRadius: 10 }}>
            <img src={p.img} alt={p.nama} style={{ width: "100%", borderRadius: 8, aspectRatio: "3/2", objectFit: "cover" }} />
            <h3 style={{ margin: "8px 0" }}>{p.nama}</h3>
            <select
              value={selectedVarian[p.id] || 0}
              onChange={(e) =>
                setSelectedVarian({
                 ...selectedVarian,
                  [p.id]: Number(e.target.value)
                })
              }
              style={{ width: "100%", padding: 6, marginBottom: 8 }}
            >
              {p.varian.map((v, i) => (
                <option key={i} value={i}>
                  {v.nama} - {formatIDR(v.harga)}
                </option>
              ))}
            </select>
            <button
              onClick={() => addToCart(p)}
              style={{ width: "100%", padding: 8, background: "#16a34a", color: "#fff", border: "none", borderRadius: 6 }}
            >
              + Keranjang
            </button>
          </div>
        ))}
      </div>

      {/* CART */}
      <h2 style={{ marginTop: 30 }}>🛒 Keranjang</h2>
      {Object.keys(cart).length === 0 && <p>Keranjang masih kosong</p>}

      {Object.entries(cart).map(([key, item]) => (
        <div key={key} style={{ background: "white", margin: "8px 0", padding: 10, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <img src={item.img} width={60} height={60} style={{ borderRadius: 6, objectFit: "cover" }} />
          <div style={{ flex: 1 }}>
            <b>{item.nama}</b>
            <p style={{ margin: "4px 0", fontSize: 14, color: "#555" }}>{item.varian}</p>
            <p style={{ margin: 0 }}>{formatIDR(item.harga)} x {item.qty}</p>
          </div>
          <div>
            <button onClick={() => updateQty(key, -1)} style={{ padding: "4px 8px" }}>-</button>
            <span style={{ margin: "0 8px" }}>{item.qty}</span>
            <button onClick={() => updateQty(key, 1)} style={{ padding: "4px 8px" }}>+</button>
          </div>
        </div>
      ))}

      <h3>Total: {formatIDR(total)}</h3>

      {/* FORM */}
      <div style={{ background: "#fff", padding: 15, borderRadius: 10, marginTop: 20 }}>
        <h3>Data Pembeli</h3>
        <input placeholder="Nama" value={nama} onChange={e => setNama(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />
        <input placeholder="Alamat Lengkap" value={alamat} onChange={e => setAlamat(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />
        <input placeholder="No HP: 08xxxx" value={noHp} onChange={e => setNoHp(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />
        <select value={metode} onChange={e => setMetode(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }}>
          <option value="COD">COD</option>
          <option value="Transfer">Transfer</option>
          <option value="QRIS">QRIS</option>
        </select>
        <button
          onClick={checkout}
          disabled={loading || total === 0}
          style={{ width: "100%", padding: 12, background: loading? "#9ca3af" : "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: "bold" }}
        >
          {loading? "Mengirim..." : `CHECKOUT ${formatIDR(total)}`}
        </button>
      </div>
    </div>
  )
}
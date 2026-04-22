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

  // FIX 1: Bikin function format duit biar gak NaN
  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(Number(value) || 0)

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, "products"))

      const data = snap.docs.map(doc => {
        const p = doc.data()
        // FIX 2: Paksa harga dari DB jadi Number, kalo kosong pake 0
        const baseHarga = Number(p.harga) || 0

        return {
          id: doc.id,
          nama: p.nama,
          img: p.img || "https://placehold.co/300x200",
          // FIX 3: Pastiin varian.harga juga Number
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
          harga: v.harga,
          img: product.img,
          qty: qty + 1
        }
      }
    })
  }

  const total = Object.values(cart).reduce(
    (sum, item) => sum + (Number(item.harga) || 0) * (item.qty || 0),
    0
  )

  const checkout = async () => {
    // Validasi form
    if (!nama ||!alamat ||!noHp) {
      return alert("Lengkapi nama, alamat, no HP!")
    }
    if (!/^[0-9]{10,15}$/.test(noHp)) {
      return alert("No HP harus 10-15 angka, tanpa +62 atau spasi")
    }

    // FIX 4: Mapping ulang biar cocok sama rules Firestore
    const itemsToSend = Object.values(cart).map(item => ({
      name: item.nama, // 'nama' -> 'name'
      price: item.harga, // 'harga' -> 'price'
      qty: item.qty,
      varian: item.varian
      // 'id' & 'img' dibuang biar lolos rules.hasOnly()
    }))

    if (itemsToSend.length === 0) {
      return alert("Keranjang kosong!")
    }

    try {
      setLoading(true)

      await addDoc(collection(db, "orders"), {
        nama,
        alamat,
        noHp,
        items: itemsToSend, // Kirim yg udah di-mapping
        total,
        grandTotal: total,
        metode,
        status: "pending",
        waktu: serverTimestamp()
      })

      alert("Order berhasil masuk!")

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
    <div style={{ padding: 20, fontFamily: "sans-serif", background: "#f6f6f6" }}>

      <h1>🍹 TOTALGO STORE</h1>

      {/* PRODUCTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: "#fff", padding: 10, borderRadius: 10 }}>

            <img src={p.img} style={{ width: "100%", borderRadius: 8 }} />

            <h3>{p.nama}</h3>

            <select
              value={selectedVarian[p.id] || 0} // FIX 5: Kasih default value
              onChange={(e) =>
                setSelectedVarian({
                 ...selectedVarian,
                  [p.id]: Number(e.target.value)
                })
              }
            >
              {p.varian.map((v, i) => (
                <option key={i} value={i}>
                  {v.nama} - {formatIDR(v.harga)} {/* FIX 6: Pake formatIDR */}
                </option>
              ))}
            </select>

            <button onClick={() => addToCart(p)}>
              + Keranjang
            </button>
          </div>
        ))}
      </div>

      {/* CART */}
      <h2>🛒 Keranjang</h2>

      {Object.values(cart).map((item, i) => (
        <div key={i} style={{ background: "white", margin: 5, padding: 10 }}>
          <img src={item.img} width={60} />
          <b>{item.nama}</b>
          <p>{item.varian}</p>
          <p>{formatIDR(item.harga)} x {item.qty}</p> {/* FIX 7: Pake formatIDR */}
        </div>
      ))}

      <h3>Total: {formatIDR(total)}</h3> {/* FIX 8: Pake formatIDR */}

      {/* FORM */}
      <input placeholder="nama" value={nama} onChange={e => setNama(e.target.value)} />
      <input placeholder="alamat" value={alamat} onChange={e => setAlamat(e.target.value)} />
      <input placeholder="no hp" value={noHp} onChange={e => setNoHp(e.target.value)} />

      <select value={metode} onChange={e => setMetode(e.target.value)}>
        <option value="COD">COD</option>
        <option value="Transfer">Transfer</option>
        <option value="QRIS">QRIS</option>
      </select>

      <button onClick={checkout} disabled={loading}>
        {loading? "Processing..." : "CHECKOUT"}
      </button>

    </div>
  )
}
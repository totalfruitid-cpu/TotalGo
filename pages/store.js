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

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "products"))

      const data = snap.docs.map(doc => {
        const p = doc.data()

        return {
          id: doc.id,
          nama: p.nama,
          img: p.img || "https://placehold.co/300x200",
          varian: p.varian || [
            { nama: "Lite Healthy", harga: p.harga },
            { nama: "Regular", harga: p.harga + 3000 },
            { nama: "Sultan", harga: p.harga + 7000 }
          ]
        }
      })

      setProducts(data)
    }

    fetch()
  }, [])

  const addToCart = (product) => {
    const index = selectedVarian[product.id] || 0
    const v = product.varian[index]

    const key = product.id + "_" + v.nama

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
    (sum, item) => sum + (item.harga || 0) * (item.qty || 0),
    0
  )

  const checkout = async () => {
    const items = Object.values(cart)

    await addDoc(collection(db, "orders"), {
      nama,
      alamat,
      noHp,
      items,
      total,
      grandTotal: total,
      metode,
      status: "pending",
      waktu: serverTimestamp()
    })

    alert("Order masuk!")
    setCart({})
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", background: "#f6f6f6" }}>

      <h1>🍹 TOTALGO STORE</h1>

      {/* PRODUCTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: "white", padding: 10, borderRadius: 10 }}>

            <img src={p.img} style={{ width: "100%", borderRadius: 8 }} />

            <h3>{p.nama}</h3>

            {/* VARIAN */}
            <select
              onChange={(e) =>
                setSelectedVarian({
                  ...selectedVarian,
                  [p.id]: Number(e.target.value)
                })
              }
            >
              {p.varian.map((v, i) => (
                <option key={i} value={i}>
                  {v.nama} - Rp{v.harga}
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
          <p>Rp{item.harga} x {item.qty}</p>
        </div>
      ))}

      <h3>Total: Rp{isNaN(total) ? 0 : total}</h3>

      {/* FORM */}
      <input placeholder="nama" onChange={e => setNama(e.target.value)} />
      <input placeholder="alamat" onChange={e => setAlamat(e.target.value)} />
      <input placeholder="no hp" onChange={e => setNoHp(e.target.value)} />

      <button onClick={checkout}>
        CHECKOUT
      </button>
    </div>
  )
}
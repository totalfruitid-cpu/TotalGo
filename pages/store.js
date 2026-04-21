import { useEffect, useState } from "react"
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore"
import { db } from "../firebase"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({}) // {productId: qty}
  const [loading, setLoading] = useState(true)
  const [nama, setNama] = useState("")
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id,...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  const addQty = (id, stok) => {
    const currentQty = cart[id] || 0
    if (currentQty >= stok) return alert("Stok mentok bos")
    setCart({...cart, [id]: currentQty + 1})
  }

  const subQty = (id) => {
    const currentQty = cart[id] || 0
    if (currentQty <= 1) {
      const newCart = {...cart}
      delete newCart[id]
      setCart(newCart)
    } else {
      setCart({...cart, [id]: currentQty - 1})
    }
  }

  const totalHarga = Object.entries(cart).reduce((sum, [id, qty]) => {
    const prod = products.find(p => p.id === id)
    return sum + (prod?.harga || 0) * qty
  }, 0)

  const totalItem = Object.values(cart).reduce((a, b) => a + b, 0)

  const checkout = async () => {
    if (!nama.trim()) return alert("Nama kosong bos")
    if (Object.keys(cart).length === 0) return alert("Keranjang kosong")

    setIsCheckingOut(true)

    // 1. Validasi + kurangin stok semua item
    try {
      for (const [id, qty] of Object.entries(cart)) {
        const prod = products.find(p => p.id === id)
        if (prod.stok < qty) {
          throw new Error(`Stok ${prod.nama} kurang. Sisa ${prod.stok}`)
        }
        await updateDoc(doc(db, "products", id), { stok: increment(-qty) })
      }

      // 2. Bikin order
      const items = Object.entries(cart).map(([id, qty]) => {
        const p = products.find(prod => prod.id === id)
        return { id, nama: p.nama, harga: p.harga, qty, subtotal: p.harga * qty }
      })

      await addDoc(collection(db, "orders"), {
        items,
        total: totalHarga,
        nama: nama.trim(),
        status: "pending",
        metode: "Ambil di Tempat",
        waktu: serverTimestamp(),
        queue: Date.now()
      })

      alert("Order masuk bos! Tunggu dipanggil ya")
      setCart({})
      setNama("")
    } catch (e) {
      alert("Gagal checkout: " + e.message)
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (loading) return <div className="p-4 animate-pulse">Loading produk...</div>
  if (!products.length) return <div className="p-4">Produk belum ada bos. Isi dulu di Firestore.</div>

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-4">Store Bosku</h1>

      <input
        value={nama}
        onChange={e => setNama(e.target.value)}
        placeholder="Nama lu bos"
        className="border p-3 mb-4 w-full rounded-lg"
      />

      {products.map((p) => (
        <div key={p.id} className="border p-3 mb-2 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold">{p.nama}</p>
            <p className="text-sm text-gray-600">
              Rp{p.harga?.toLocaleString("id-ID")} | Stok: {p.stok}
            </p>
          </div>

          {p.stok === 0? (
            <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg">Habis</button>
          ) : cart[p.id]? (
            <div className="flex items-center gap-3">
              <button onClick={() => subQty(p.id)} className="bg-red-500 text-white w-8 h-8 rounded-lg">-</button>
              <span className="font-bold w-4 text-center">{cart[p.id]}</span>
              <button onClick={() => addQty(p.id, p.stok)} className="bg-green-500 text-white w-8 h-8 rounded-lg">+</button>
            </div>
          ) : (
            <button onClick={() => addQty(p.id, p.stok)} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
              Beli
            </button>
          )}
        </div>
      ))}

      {totalItem > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <div>
              <p className="text-sm text-gray-600">{totalItem} item</p>
              <p className="font-bold text-lg">Rp{totalHarga.toLocaleString("id-ID")}</p>
            </div>
            <button
              onClick={checkout}
              disabled={isCheckingOut}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold disabled:bg-gray-400"
            >
              {isCheckingOut? "Proses..." : "CHECKOUT"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
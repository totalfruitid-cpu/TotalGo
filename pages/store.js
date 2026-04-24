import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [selectedVarian, setSelectedVarian] = useState({})
  const [loading, setLoading] = useState(true)

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
        const data = snap.docs.map(doc => ({ id: doc.id,...doc.data() }))
        setProducts(data)
      } catch (e) {
        console.log("Error fetch:", e)
      } finally {
        setLoading(false) // PASTI MATIIN LOADING
      }
    }
    fetchData()
  }, [])

  const getVarianList = (p) => {
    if (!p?.punya_varian) return [{ nama: "Regular", harga: p?.harga_lite || 0, stok: p?.stok_lite || 0 }]
    return [
      { nama: "Lite", harga: p?.harga_lite || 0, stok: p?.stok_lite || 0 },
      { nama: "Healthy", harga: p?.harga_healthy || 0, stok: p?.stok_healthy || 0 },
      { nama: "Sultan", harga: p?.harga_sultan || 0, stok: p?.stok_sultan || 0 }
    ].filter(v => v.harga > 0)
  }

  const addToCart = (p) => {
    const varianList = getVarianList(p)
    const idx = selectedVarian[p.id] || 0
    const currentVarian = varianList[idx]
    if (!currentVarian || currentVarian.stok <= 0) return alert("Stok habis bos")

    const exist = cart.find(i => i.id === p.id && i.varian === currentVarian.nama)
    if (exist) {
      setCart(cart.map(i =>
        i.id === p.id && i.varian === currentVarian.nama
       ? {...i, qty: i.qty + 1 }
          : i
      ))
    } else {
      setCart([...cart, {
        id: p.id,
        nama: p.nama,
        varian: currentVarian.nama,
        harga: currentVarian.harga,
        img: p.gambar_url || '/menu-default.png',
        qty: 1
      }])
    }
  }

  const checkout = async () => {
    if (cart.length === 0) return
    await addDoc(collection(db, "orders"), {
      items: cart,
      total: cart.reduce((a, b) => a + b.harga * b.qty, 0),
      status: "pending",
      createdAt: serverTimestamp(),
      nama: "Customer",
      noWa: "628xxx"
    })
    setCart([])
    alert("Order berhasil! Fresh langsung dibikinin 🛵")
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#F97316] p-4 sticky top-0 z-20 shadow-md">
        <h1 className="text-white font-bold text-2xl">Total Fruit 🍓</h1>
        <p className="text-orange-100 text-sm">Fresh & Healthy Every Day</p>
      </div>

      <div className="mx-4 my-4 bg-gradient-to-r from-[#F97316] to-orange-400 p-4 rounded-2xl text-white">
        <p className="font-bold text-lg">🔥 Gratis Ongkir!</p>
        <p className="text-sm text-orange-100">Min. belanja 50rb</p>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((p) => {
          const varianList = getVarianList(p)
          const idx = selectedVarian[p.id] || 0
          const currentVarian = varianList[idx] || varianList[0]

          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-md overflow-hidden relative">
              {/* BADGE BARU PANEN */}
              {currentVarian?.stok > 10 && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10 font-bold">
                  ✨ Baru Panen
                </div>
              )}

              <img src={p.gambar_url || '/menu-default.png'} alt={p.nama} className="w-full h-32 object-cover" onError={(e) => e.target.src = '/menu-default.png'} />
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{p.nama}</h3>
                <p className="text-[#F97316] font-bold text-lg mb-1">{formatIDR(currentVarian?.harga)}</p>

                {/* STOK TIPIS ALERT - INI SOFT SELLING PALING NAMPOL */}
                {currentVarian?.stok <= 3 && currentVarian?.stok > 0 && (
                  <p className="text-xs text-red-500 font-semibold animate-pulse mb-1">
                    🔥 Sisa {currentVarian.stok} lagi!
                  </p>
                )}
                {currentVarian?.stok <= 0 && (
                  <p className="text-xs text-gray-400 font-semibold mb-1">Stok Habis</p>
                )}

                {varianList.length > 1 && (
                  <select
                    value={idx}
                    onChange={e => setSelectedVarian({...selectedVarian, [p.id]: Number(e.target.value) })}
                    className="w-full text-xs border rounded-lg p-2 mb-2"
                  >
                    {varianList.map((v, i) => (
                      <option key={i} value={i} disabled={v.stok <= 0}>
                        {v.nama} {v.stok <= 0? '(Habis)' : `- Stok ${v.stok}`}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => addToCart(p)}
                  disabled={!currentVarian || currentVarian?.stok <= 0}
                  className="w-full bg-[#F97316] text-white py-2 rounded-xl text-sm font-semibold disabled:bg-gray-300 active:scale-95"
                >
                  {!currentVarian || currentVarian?.stok <= 0? 'Habis' : '+ Keranjang'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">{cart.reduce((a,b)=>a+b.qty,0)} item</p>
              <p className="font-bold text-[#F97316] text-xl">{formatIDR(cart.reduce((a, b) => a + b.harga * b.qty, 0))}</p>
            </div>
            <button onClick={checkout} className="bg-[#F97316] text-white px-6 py-3 rounded-xl font-bold active:scale-95">
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
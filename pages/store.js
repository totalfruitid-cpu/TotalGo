import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [selectedVarian, setSelectedVarian] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCheckout, setShowCheckout] = useState(false)
  const [customer, setCustomer] = useState({ nama: "", noWa: "", alamat: "" })
  const [metodeBayar, setMetodeBayar] = useState("COD")

  // GANTI NOMOR WA TOKO LU DI SINI
  const NO_WA_TOKO ="6285124441513" // ⚠️ GANTI PAKE NO LU

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
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getVarianList = (p) => {
    if (!p?.punya_varian) {
      return [{ nama: "Regular", harga: p?.harga_lite || 0, stok: p?.stok_lite || 0 }]
    }
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

  const removeFromCart = (id, varian) => {
    setCart(cart.filter(i =>!(i.id === id && i.varian === varian)))
  }

  const updateQty = (id, varian, delta) => {
    setCart(cart.map(i => {
      if (i.id === id && i.varian === varian) {
        const newQty = i.qty + delta
        return newQty > 0? {...i, qty: newQty } : null
      }
      return i
    }).filter(Boolean))
  }

  // INI YG GUA BENERIN BRO - UDAH BISA BUKA WA
  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Keranjang masih kosong bro")
    if (!customer.nama.trim()) return alert("Nama wajib diisi")
    if (!customer.noWa.trim()) return alert("No WA wajib diisi")
    if (!customer.alamat.trim()) return alert("Alamat wajib diisi")

    const total = cart.reduce((a, b) => a + b.harga * b.qty, 0)

    try {
      // 1. Simpen ke Firebase
      await addDoc(collection(db, "orders"), {
        items: cart,
        total: total,
        status: "pending",
        metodeBayar: metodeBayar,
        createdAt: serverTimestamp(),
        nama: customer.nama,
        noWa: customer.noWa,
        alamat: customer.alamat
      })

      // 2. Bikin format chat WA
      const listItem = cart.map(item =>
        `• ${item.nama} ${item.varian} x${item.qty}%0A ${formatIDR(item.harga * item.qty)}`
      ).join('%0A')

      const pesanWA = `*🔥 Order Baru Total Fruit*%0A%0A*Nama:* ${customer.nama}%0A*No WA:* ${customer.noWa}%0A*Alamat:* ${customer.alamat}%0A*Pembayaran:* ${metodeBayar}%0A%0A*Pesanan:*%0A${listItem}%0A%0A*Total: ${formatIDR(total)}*%0A%0AMohon diproses ya min 🙏`

      // 3. BUKA WA OTOMATIS - INI KUNCINYA
      window.open(`https://wa.me/${NO_WA_TOKO}?text=${pesanWA}`, '_blank')

      // 4. Reset
      setCart([])
      setShowCheckout(false)
      setCustomer({ nama: "", noWa: "", alamat: "" })

    } catch (error) {
      console.log("Error checkout:", error)
      alert("Order gagal. Coba lagi bro")
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
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
          const isHabis =!currentVarian || currentVarian?.stok <= 0
          const isNonVarian =!p?.punya_varian

          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-md overflow-hidden relative">
              {currentVarian?.stok > 10 && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10 font-bold">
                  ✨ Baru Panen
                </div>
              )}

              <img
                src={p.gambar_url || '/menu-default.png'}
                alt={p.nama}
                className="w-full h-32 object-cover"
                onError={(e) => e.target.src = '/menu-default.png'}
              />
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{p.nama}</h3>
                <p className="text-[#F97316] font-bold text-lg mb-1">{formatIDR(currentVarian?.harga)}</p>

                {currentVarian?.stok <= 3 && currentVarian?.stok > 0 && (
                  <p className="text-xs text-red-500 font-semibold animate-pulse mb-1">
                    🔥 Sisa {currentVarian.stok} lagi!
                  </p>
                )}
                {isHabis && (
                  <p className="text-xs text-gray-400 font-semibold mb-1">Stok Habis</p>
                )}

                {!isNonVarian && varianList.length > 1 && (
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
                  disabled={isHabis}
                  className="w-full bg-[#F97316] text-white py-2 rounded-xl text-sm font-semibold disabled:bg-gray-300 active:scale-95"
                >
                  {isHabis? 'Habis' : '+ Keranjang'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* FLOATING CART ICON */}
      <div className="fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setShowCheckout(true)}
          className="bg-[#F97316] text-white p-4 rounded-full shadow-2xl active:scale-90 relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0.955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0.75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0.75.75 0 011.5 0z" />
          </svg>
          {cart.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cart.reduce((a, b) => a + b.qty, 0)}
            </div>
          )}
        </button>
      </div>

      {/* MODAL CHECKOUT */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl">Checkout</h2>
              <button onClick={() => setShowCheckout(false)} className="text-gray-500">✕</button>
            </div>

            {/* LIST ITEM */}
            {cart.length === 0? (
              <p className="text-center text-gray-500 py-8">Keranjang kosong bro</p>
            ) : (
              <>
                {cart.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 border-b py-3">
                    <img src={item.img} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.nama}</p>
                      <p className="text-xs text-gray-500">{item.varian}</p>
                      <p className="text-[#F97316] font-bold">{formatIDR(item.harga)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, item.varian, -1)} className="bg-gray-200 w-7 h-7 rounded-lg">-</button>
                      <span className="w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.varian, 1)} className="bg-gray-200 w-7 h-7 rounded-lg">+</button>
                    </div>
                  </div>
                ))}

                {/* FORM DATA */}
                <div className="mt-4 space-y-3">
                  <input
                    placeholder="Nama Lengkap"
                    value={customer.nama}
                    onChange={e => setCustomer({...customer, nama: e.target.value })}
                    className="w-full border p-3 rounded-xl"
                  />
                  <input
                    placeholder="No. WA: 628xxx"
                    value={customer.noWa}
                    onChange={e => setCustomer({...customer, noWa: e.target.value })}
                    className="w-full border p-3 rounded-xl"
                  />
                  <textarea
                    placeholder="Alamat Lengkap"
                    value={customer.alamat}
                    onChange={e => setCustomer({...customer, alamat: e.target.value })}
                    className="w-full border p-3 rounded-xl"
                    rows={2}
                  />

                  {/* METODE BAYAR */}
                  <div>
                    <p className="text-sm font-semibold mb-2">Metode Pembayaran:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['COD', 'QRIS', 'Transfer'].map(m => (
                        <button
                          key={m}
                          onClick={() => setMetodeBayar(m)}
                          className={`p-3 rounded-xl border text-sm font-semibold ${metodeBayar === m? 'bg-[#F97316] text-white border-[#F97316]' : 'bg-white'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TOTAL */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-xl text-[#F97316]">{formatIDR(cart.reduce((a, b) => a + b.harga * b.qty, 0))}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 ||!customer.nama ||!customer.noWa ||!customer.alamat}
                    className="w-full bg-[#F97316] text-white py-4 rounded-xl font-bold text-lg active:scale-95 disabled:bg-gray-300 disabled:active:scale-100"
                  >
                    Pesan Sekarang
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
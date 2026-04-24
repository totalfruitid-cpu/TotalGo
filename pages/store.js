import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [selectedVarian, setSelectedVarian] = useState({})
  const [showCart, setShowCart] = useState(false)

  const [nama, setNama] = useState("")
  const [alamat, setAlamat] = useState("")
  const [noHp, setNoHp] = useState("")
  const [metode, setMetode] = useState("COD")
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

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
          const baseHarga = Number(p.harga) || 0
          return {
            id: doc.id,
            nama: p.nama,
            img: p.img || "https://placehold.co/300x200",
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
          harga: Number(v.harga) || 0,
          img: product.img,
          qty: qty + 1
        }
      }
    })

    // Auto buka cart kalo nambah item
    setShowCart(true)
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

  const totalQty = Object.values(cart).reduce((sum, item) => sum + item.qty, 0)

  const checkout = async () => {
    if (!nama.trim() ||!alamat.trim() ||!noHp.trim()) {
      return alert("Lengkapi nama, alamat, no HP!")
    }
    if (!/^[0-9]{10,15}$/.test(noHp)) {
      return alert("No HP harus 10-15 angka, contoh: 08582638468")
    }

    const itemsToSend = Object.values(cart).map(item => ({
      name: String(item.nama),
      price: Number(item.harga) || 0,
      qty: Number(item.qty) || 0,
      varian: String(item.varian)
    }))

    if (itemsToSend.length === 0) return alert("Keranjang kosong!")

    const finalTotal = Number(total) || 0
    const orderData = {
      nama: String(nama.trim()),
      alamat: String(alamat.trim()),
      noHp: String(noHp.trim()),
      items: itemsToSend,
      total: finalTotal,
      grandTotal: finalTotal,
      metode: String(metode),
      status: "pending",
      waktu: serverTimestamp()
    }

    try {
      setLoading(true)
      await addDoc(collection(db, "orders"), orderData)
      setOrderSuccess(true)
      setCart({})
      setNama("")
      setAlamat("")
      setNoHp("")
      setMetode("COD")
      setShowCart(false)
      setTimeout(() => setOrderSuccess(false), 4000)
    } catch (err) {
      console.error("Gagal order:", err)
      alert("Gagal order: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER ORANGE */}
      <div className="bg-[#F97316] p-4 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white font-bold text-2xl">TotalGo Store 🛵</h1>
            <p className="text-orange-100 text-sm">Fresh Fruit Delivery</p>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative bg-white text-[#F97316] px-4 py-2 rounded-xl font-semibold active:scale-95"
          >
            🛒 Keranjang
            {totalQty > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
                {totalQty}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS NOTIF */}
      {orderSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 animate-bounce">
          ✅ Order berhasil! Tunggu kasir proses ya
        </div>
      )}

      {/* GRID PRODUK */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map(p => {
          const currentVarian = p.varian[selectedVarian[p.id] || 0]
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-md overflow-hidden active:scale-95 transition">
              <img
                src={p.img}
                alt={p.nama}
                className="w-full aspect-[3/2] object-cover"
              />
              <div className="p-3">
                <h3 className="font-bold text-gray-800 mb-1 truncate">{p.nama}</h3>
                <p className="text-[#F97316] font-semibold text-lg mb-2">
                  {formatIDR(currentVarian.harga)}
                </p>
                <select
                  value={selectedVarian[p.id] || 0}
                  onChange={(e) => setSelectedVarian({...selectedVarian, [p.id]: Number(e.target.value)})}
                  className="w-full border border-gray-300 rounded-xl px-2 py-2 mb-2 text-sm"
                >
                  {p.varian.map((v, i) => (
                    <option key={i} value={i}>
                      {v.nama}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => addToCart(p)}
                  className="w-full bg-[#F97316] text-white py-2 rounded-xl font-semibold hover:bg-orange-600 active:scale-95"
                >
                  + Tambah
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* SLIDE UP CART */}
      {showCart && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowCart(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-40 max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-xl">🛒 Keranjang Kamu</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-2xl"
              >✕</button>
            </div>

            <div className="p-4">
              {Object.keys(cart).length === 0? (
                <div className="text-center py-10">
                  <p className="text-6xl mb-3">🛒</p>
                  <p className="text-gray-500">Keranjang masih kosong</p>
                </div>
              ) : (
                <>
                  {Object.entries(cart).map(([key, item]) => (
                    <div key={key} className="flex gap-3 mb-3 pb-3 border-b">
                      <img src={item.img} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <b className="text-gray-800">{item.nama}</b>
                        <p className="text-sm text-gray-500">{item.varian}</p>
                        <p className="text-[#F97316] font-semibold">{formatIDR(item.harga)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(key, -1)}
                          className="w-8 h-8 rounded-lg bg-gray-200 font-bold active:scale-90"
                        >-</button>
                        <span className="font-semibold w-6 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(key, 1)}
                          className="w-8 h-8 rounded-lg bg-[#F97316] text-white font-bold active:scale-90"
                        >+</button>
                      </div>
                    </div>
                  ))}

                  <div className="bg-gray-50 p-4 rounded-2xl mt-4">
                    <h3 className="font-bold text-lg mb-3">Data Pembeli</h3>
                    <input
                      placeholder="Nama Lengkap"
                      value={nama}
                      onChange={e => setNama(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 mb-3"
                    />
                    <input
                      placeholder="Alamat Lengkap"
                      value={alamat}
                      onChange={e => setAlamat(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 mb-3"
                    />
                    <input
                      placeholder="No HP: 08xxxx"
                      value={noHp}
                      onChange={e => setNoHp(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 mb-3"
                    />
                    <select
                      value={metode}
                      onChange={e => setMetode(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 mb-4"
                    >
                      <option value="COD">💵 COD - Bayar di Tempat</option>
                      <option value="Transfer">🏦 Transfer Bank</option>
                      <option value="QRIS">📱 QRIS</option>
                    </select>

                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Total Bayar</span>
                      <span className="text-2xl font-bold text-[#F97316]">{formatIDR(total)}</span>
                    </div>

                    <button
                      onClick={checkout}
                      disabled={loading || total === 0}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                        loading || total === 0
                         ? 'bg-gray-300 text-gray-500'
                          : 'bg-[#F97316] text-white hover:bg-orange-600 active:scale-95'
                      }`}
                    >
                      {loading? "Mengirim..." : `CHECKOUT SEKARANG`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
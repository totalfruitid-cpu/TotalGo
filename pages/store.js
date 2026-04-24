import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit, where } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [selectedVarian, setSelectedVarian] = useState({})
  const [loading, setLoading] = useState(true)
  const [liveActivity, setLiveActivity] = useState(null)
  const [bestSellerId, setBestSellerId] = useState(null)
  const [isHappyHour, setIsHappyHour] = useState(false)
  const [happyHourEnd, setHappyHourEnd] = useState(null)

  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(Number(value) || 0)

  // 1. CEK HAPPY HOUR: Jam 13-15
  useEffect(() => {
    const checkHappyHour = () => {
      const now = new Date()
      const hour = now.getHours()
      if (hour >= 13 && hour < 15) {
        setIsHappyHour(true)
        const end = new Date()
        end.setHours(15, 0, 0, 0)
        setHappyHourEnd(end)
      } else {
        setIsHappyHour(false)
      }
    }
    checkHappyHour()
    const interval = setInterval(checkHappyHour, 60000) // cek tiap menit
    return () => clearInterval(interval)
  }, [])

  // 2. FETCH PRODUK + BEST SELLER
  useEffect(() => {
    const fetchData = async () => {
      // Ambil produk
      const snap = await getDocs(collection(db, "products"))
      const data = snap.docs.map(doc => ({ id: doc.id,...doc.data() }))
      setProducts(data)

      // Ambil best seller minggu ini
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const orderQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", weekAgo)
      )
      const orderSnap = await getDocs(orderQuery)
      const productCount = {}
      orderSnap.docs.forEach(doc => {
        doc.data().items?.forEach(item => {
          productCount[item.id] = (productCount[item.id] || 0) + item.qty
        })
      })
      const bestSeller = Object.keys(productCount).reduce((a, b) =>
        productCount[a] > productCount[b]? a : b, null
      )
      setBestSellerId(bestSeller)
      setLoading(false)
    }
    fetchData()
  }, [])

  // 3. LIVE ACTIVITY PALSU tapi berasa real
  useEffect(() => {
    const names = ["Rina", "Budi", "Sari", "Andi", "Dewi", "Joko"]
    const cities = ["Ciburial", "Serpong", "BSD", "Bintaro"]
    const interval = setInterval(() => {
      if (products.length > 0 && Math.random() > 0.3) {
        const randomProduct = products[Math.floor(Math.random() * products.length)]
        const randomName = names[Math.floor(Math.random() * names.length)]
        const randomCity = cities[Math.floor(Math.random() * cities.length)]
        setLiveActivity({ nama: randomName, kota: randomCity, produk: randomProduct.nama })
        setTimeout(() => setLiveActivity(null), 4000)
      }
    }, 8000) // muncul tiap 8 detik
    return () => clearInterval(interval)
  }, [products])

  const getVarianList = (p) => {
    if (!p.punya_varian) return [{ nama: "Regular", harga: p.harga_lite || 0, stok: p.stok_lite || 0 }]
    return [
      { nama: "Lite", harga: p.harga_lite || 0, stok: p.stok_lite || 0 },
      { nama: "Healthy", harga: p.harga_healthy || 0, stok: p.stok_healthy || 0 },
      { nama: "Sultan", harga: p.harga_sultan || 0, stok: p.stok_sultan || 0 }
    ].filter(v => v.harga > 0)
  }

  const getHargaAfterDiscount = (harga) => {
    return isHappyHour? Math.round(harga * 0.8) : harga // 20% off
  }

  const addToCart = (p) => {
    const varianList = getVarianList(p)
    const idx = selectedVarian[p.id] || 0
    const currentVarian = varianList[idx]
    if (currentVarian.stok <= 0) return alert("Stok habis bos")

    const hargaFinal = getHargaAfterDiscount(currentVarian.harga)
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
        harga: hargaFinal,
        hargaAsli: currentVarian.harga,
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

  const getCountdown = () => {
    if (!happyHourEnd) return ""
    const diff = happyHourEnd - new Date()
    const hours = Math.floor(diff / 1000 / 60 / 60)
    const mins = Math.floor(diff / 1000 / 60) % 60
    return `${hours}j ${mins}m lagi`
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* HEADER */}
      <div className="bg-[#F97316] p-4 sticky top-0 z-20 shadow-md">
        <h1 className="text-white font-bold text-2xl">Total Fruit 🍓</h1>
        <p className="text-orange-100 text-sm">Fresh & Healthy Every Day</p>
      </div>

      {/* HAPPY HOUR BANNER */}
      {isHappyHour && (
        <div className="mx-4 my-4 bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl text-white animate-pulse">
          <p className="font-bold text-lg">⚡ HAPPY HOUR 20% OFF!</p>
          <p className="text-sm text-pink-100">Semua varian diskon. Berakhir {getCountdown()}</p>
        </div>
      )}

      {/* BANNER BIASA */}
      <div className="mx-4 my-4 bg-gradient-to-r from-[#F97316] to-orange-400 p-4 rounded-2xl text-white">
        <p className="font-bold text-lg">🔥 Gratis Ongkir!</p>
        <p className="text-sm text-orange-100">Min. belanja 50rb</p>
      </div>

      {/* LIST PRODUK */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((p, index) => {
          const varianList = getVarianList(p)
          const idx = selectedVarian[p.id] || 0
          const currentVarian = varianList[idx] || varianList[0]
          const hargaFinal = getHargaAfterDiscount(currentVarian?.harga)
          const isBestSeller = p.id === bestSellerId
          const isNewStock = currentVarian?.stok > 10 // anggap stok > 10 = baru restock

          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-md overflow-hidden relative">
              {/* BADGE BEST SELLER */}
              {isBestSeller && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 font-bold">
                  🔥 Terlaris
                </div>
              )}
              {/* BADGE FRESH */}
              {isNewStock &&!isBestSeller && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10 font-bold">
                  ✨ Baru Panen
                </div>
              )}

              <img src={p.gambar_url || '/menu-default.png'} alt={p.nama} className="w-full h-32 object-cover" />
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{p.nama}</h3>

                {/* HARGA + DISKON */}
                <div className="flex items-baseline gap-1 mb-1">
                  <p className="text-[#F97316] font-bold text-lg">{formatIDR(hargaFinal)}</p>
                  {isHappyHour && (
                    <p className="text-xs text-gray-400 line-through">{formatIDR(currentVarian?.harga)}</p>
                  )}
                </div>

                {/* STOK TIPIS ALERT */}
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
                  disabled={currentVarian?.stok <= 0}
                  className="w-full bg-[#F97316] text-white py-2 rounded-xl text-sm font-semibold disabled:bg-gray-300 active:scale-95"
                >
                  {currentVarian?.stok <= 0? 'Habis' : '+ Keranjang'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* LIVE ACTIVITY POPUP */}
      {liveActivity && (
        <div className="fixed bottom-24 left-4 bg-white shadow-2xl rounded-xl p-3 text-xs border-l-4 border-green-500 animate-bounce z-30">
          <p><span className="font-bold">{liveActivity.nama}</span> dari {liveActivity.kota}</p>
          <p className="text-gray-500">baru beli {liveActivity.produk} 🎉</p>
        </div>
      )}

      {/* CART */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">{cart.reduce((a,b)=>a+b.qty,0)} item</p>
              <p className="font-bold text-[#F97316] text-xl">{formatIDR(cart.reduce((a, b) => a + b.harga * b.qty, 0))}</p>
              {isHappyHour && <p className="text-xs text-green-600">Hemat {formatIDR(cart.reduce((a, b) => (b.hargaAsli - b.harga) * b.qty, 0))}</p>}
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
import { useEffect, useState, useRef } from "react"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"
import { db, app } from "../lib/firebase"
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from "firebase/firestore"
import { useRouter } from "next/router"

export default function Kasir() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")
  const audioRef = useRef(null)
  const prevOrderCount = useRef(0)

  const auth = getAuth(app)
  const router = useRouter()

  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(Number(value) || 0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        listenOrders()
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const listenOrders = () => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
    onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id,...doc.data() }))
      if (data.filter(o => o.status === 'pending').length > prevOrderCount.current) {
        audioRef.current?.play()
      }
      prevOrderCount.current = data.filter(o => o.status === 'pending').length
      setOrders(data)
    })
  }

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status })
  }

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return ""
    const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000)
    if (seconds < 60) return `${seconds} detik lalu`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`
    return `${Math.floor(seconds / 3600)} jam lalu`
  }

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter)

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <audio ref={audioRef} src="/notif.mp3" />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#F97316]">Dashboard Kasir</h1>
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin')} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">Admin</button>
            <button onClick={() => signOut(auth)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm">Logout</button>
          </div>
        </div>

        {/* FILTER */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['pending', 'proses', 'selesai', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${filter === f? 'bg-[#F97316] text-white' : 'bg-white'}`}
            >
              {f === 'pending'? '🔔 Baru' : f === 'proses'? '⏳ Proses' : f === 'selesai'? '✅ Selesai' : 'Semua'}
              {f === 'pending' && ` (${orders.filter(o => o.status === 'pending').length})`}
            </button>
          ))}
        </div>

        {/* LIST ORDER */}
        <div className="space-y-3">
          {filteredOrders.length === 0? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
              Gak ada order {filter}
            </div>
          ) : filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-md p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-lg">{order.nama}</p>
                  <p className="text-sm text-gray-500">{order.noWa}</p>
                  <p className="text-xs text-gray-400">{getTimeAgo(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#F97316] text-xl">{formatIDR(order.total)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.metodeBayar === 'COD'? 'bg-green-100 text-green-700' :
                    order.metodeBayar === 'QRIS'? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {order.metodeBayar}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 mb-1">Alamat:</p>
                <p className="text-sm">{order.alamat}</p>
              </div>

              <div className="border-t pt-3 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm mb-1">
                    <span>{item.qty}x {item.nama} {item.varian!== 'Regular' && `(${item.varian})`}</span>
                    <span>{formatIDR(item.harga * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button onClick={() => updateStatus(order.id, 'proses')} className="flex-1 bg-blue-500 text-white py-2 rounded-xl font-semibold">
                    Proses
                  </button>
                )}
                {order.status === 'proses' && (
                  <button onClick={() => updateStatus(order.id, 'selesai')} className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold">
                    Selesai
                  </button>
                )}
                {order.status === 'selesai' && (
                  <div className="flex-1 bg-gray-100 text-gray-500 py-2 rounded-xl text-center font-semibold">
                    ✅ Selesai
                  </div>
                )}
                <a href={`https://wa.me/${order.noWa}`} target="_blank" className="bg-[#25D366] text-white px-4 py-2 rounded-xl font-semibold">
                  WA
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import OrderCard from '../components/OrderCard'

const TABS = [
  { key: 'pending', label: 'Pesanan Baru', emoji: '🔥' },
  { key: 'processing', label: 'Diproses', emoji: '👨‍🍳' },
  { key: 'done', label: 'Selesai', emoji: '✅' },
]

export default function Kasir() {
  const [orders, setOrders] = useState([])
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    // Ambil role dari token
    auth.currentUser.getIdTokenResult().then(token => {
      setRole(token.claims.role)
    })

    // Realtime orders - sort terbaru di atas
    const q = query(collection(db, 'orders'), orderBy('waktu', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id,...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleTerima = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { status: 'processing' })
  }

  const handleSelesai = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { status: 'done' })
  }

  // Filter order sesuai tab
  const filteredOrders = orders.filter(o => o.status === activeTab)
  const counts = {
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    done: orders.filter(o => o.status === 'done').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Orange */}
      <div className="bg-[#F97316] p-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-white font-bold text-2xl">TotalGo Kasir 🛵</h1>
        <p className="text-orange-100 text-sm">Login sebagai: {role}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white px-2 pt-4 sticky top-[76px] z-10 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition
                ${activeTab === tab.key
                 ? 'bg-[#F97316] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {tab.emoji} {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs
                  ${activeTab === tab.key? 'bg-white text-[#F97316]' : 'bg-gray-300 text-gray-700'}
                `}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List Order */}
      <div className="px-4 pt-4">
        {filteredOrders.length === 0? (
          <div className="text-center mt-20">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-gray-500 font-medium">
              {activeTab === 'pending' && 'Belum ada pesanan baru'}
              {activeTab === 'processing' && 'Tidak ada yg sedang diproses'}
              {activeTab === 'done' && 'Belum ada pesanan selesai'}
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              role={role}
              onTerima={handleTerima}
              onSelesai={handleSelesai}
            />
          ))
        )}
      </div>
    </div>
  )
}
import { useEffect, useState, useRef } from 'react'
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
  
  const audioRef = useRef(null)
  const prevPendingCount = useRef(0)
  const isFirstLoad = useRef(true)

  useEffect(() => {
    // 🔥 Setup audio - PAKE ding.mp3
    audioRef.current = new Audio('/ding.mp3')
    audioRef.current.volume = 0.5

    // Ambil role dari token
    auth.currentUser.getIdTokenResult().then(token => {
      setRole(token.claims.role)
    })

    // Realtime orders - sort terbaru di atas
    const q = query(collection(db, 'orders'), orderBy('waktu', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setOrders(data)
      
      // 🔥 LOGIC NOTIF SUARA
      const currentPendingCount = data.filter(o => o.status === 'pending').length
      
      // Jangan bunyi pas first load
      if (!isFirstLoad.current && currentPendingCount > prevPendingCount.current) {
        // 1. Play suara
        audioRef.current.play().catch(e => console.log('Audio blocked:', e))
        
        // 2. Getar HP kalo support
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        
        // 3. Ganti title tab browser
        document.title = `(${currentPendingCount}) Pesanan Baru! - TotalGo`
        
        // 4. Balikin title normal abis 3 detik
        setTimeout(() => {
          document.title = 'TotalGo Kasir'
        }, 3000)
      }
      
      prevPendingCount.current = currentPendingCount
      isFirstLoad.current = false
      setLoading(false)
    })
    
    return () => unsub()
  }, [])

  const handleTerima = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { 
      status: 'processing',
      diterimaAt: new Date()
    })
  }

  const handleSelesai = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { 
      status: 'done',
      selesaiAt: new Date()
    })
  }

  // Tombol test notif - hapus kalo udah production
  const testNotif = () => {
    audioRef.current.play()
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  }

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white font-bold text-2xl">TotalGo Kasir 🛵</h1>
            <p className="text-orange-100 text-sm">Login sebagai: {role}</p>
          </div>
          {/* Tombol test notif */}
          <button 
            onClick={testNotif}
            className="text-white text-2xl active:scale-90 transition"
          >
            🔔
          </button>
        </div>
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
                  ${activeTab === tab.key ? 'bg-white text-[#F97316]' : 'bg-red-500 text-white animate-pulse'}
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
        {filteredOrders.length === 0 ? (
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
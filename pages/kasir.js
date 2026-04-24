import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
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
  const router = useRouter()
  
  const audioRef = useRef(null)
  const prevPendingCount = useRef(0)
  const isFirstLoad = useRef(true)

  useEffect(() => {
    // 1. CEK AUTH + ROLE
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      
      const token = await user.getIdTokenResult()
      // Kasir & admin boleh masuk sini
      if (!['admin', 'kasir'].includes(token.claims.role)) {
        router.push('/login')
        return
      }
      
      setRole(token.claims.role)
      setupRealtimeOrder()
    })

    // 2. SETUP REALTIME ORDER + NOTIF
    const setupRealtimeOrder = () => {
      audioRef.current = new Audio('/ding.mp3')
      audioRef.current.volume = 0.5

      const q = query(collection(db, 'orders'), orderBy('waktu', 'desc'))
      const unsubOrder = onSnapshot(q, snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setOrders(data)
        
        // 🔔 LOGIC NOTIF: Order baru masuk
        const currentPendingCount = data.filter(o => o.status === 'pending').length
        if (!isFirstLoad.current && currentPendingCount > prevPendingCount.current) {
          // Play sound
          audioRef.current.play().catch(e => console.log('Klik layar dulu biar bunyi:', e))
          // Getar HP
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          // Ganti title tab browser
          document.title = `(${currentPendingCount}) Pesanan Baru! - TotalGo`
          setTimeout(() => { document.title = 'TotalGo Kasir' }, 3000)
        }
        
        prevPendingCount.current = currentPendingCount
        isFirstLoad.current = false
        setLoading(false)
      })
      return unsubOrder
    }

    return () => unsubAuth()
  }, [router])

  // 3. ACTION TERIMA ORDER
  const handleTerima = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { 
      status: 'processing',
      diterimaAt: new Date(),
      diterimaOleh: auth.currentUser?.email || 'kasir'
    })
  }

  // 4. ACTION SELESAI ORDER
  const handleSelesai = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { 
      status: 'done',
      selesaiAt: new Date(),
      diselesaikanOleh: auth.currentUser?.email || 'kasir'
    })
  }

  // 5. TEST NOTIF MANUAL
  const testNotif = () => {
    audioRef.current?.play()
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  }

  // 6. LOGOUT
  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  // 7. FILTER & COUNT
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
      {/* HEADER ORANGE */}
      <div className="bg-[#F97316] p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white font-bold text-2xl">TotalGo Kasir 🛵</h1>
            <p className="text-orange-100 text-sm">Login sebagai: {role}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={testNotif} className="text-white text-2xl active:scale-90 transition">🔔</button>
            <button 
              onClick={handleLogout}
              className="bg-white text-[#F97316] px-3 py-1 rounded-lg text-sm font-semibold active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white px-2 pt-4 sticky top-[72px] z-10 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition
                ${activeTab === tab.key ? 'bg-[#F97316] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {tab.emoji} {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs
                  ${activeTab === tab.key ? 'bg-white text-[#F97316]' : 'bg-red-500 text-white animate-pulse'}`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* LIST ORDER */}
      <div className="px-4 pt-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-gray-500 font-medium">
              {activeTab === 'pending' && 'Belum ada pesanan baru'}
              {activeTab === 'processing' && 'Tidak ada yg sedang diproses'}
              {activeTab === 'done' && 'Belum ada pesanan selesai hari ini'}
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
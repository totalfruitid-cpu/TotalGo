import { useEffect, useState } from "react"
import { db, auth } from "../lib/firebase"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, onAuthStateChanged } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useRouter } from "next/router"

export default function Admin() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // State edit
  const [editingId, setEditingId] = useState(null)
  const [editNama, setEditNama] = useState("")
  const [editGambar, setEditGambar] = useState("")
  const [editHargaLite, setEditHargaLite] = useState("")
  const [editHargaHealthy, setEditHargaHealthy] = useState("")
  const [editHargaSultan, setEditHargaSultan] = useState("")
  const [editStokLite, setEditStokLite] = useState("")
  const [editStokHealthy, setEditStokHealthy] = useState("")
  const [editStokSultan, setEditStokSultan] = useState("")

  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(Number(value) || 0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.replace("/login")
      const token = await user.getIdTokenResult()
      if (token.claims.role!== 'admin') return router.replace("/kasir")
      fetchData()
    })
    return () => unsubscribe()
  }, [router])

  const fetchData = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, "products"))
    const data = snap.docs.map(doc => ({ id: doc.id,...doc.data() }))
    setProducts(data)
    setLoading(false)
  }

  const mulaiEdit = (p) => {
    setEditingId(p.id)
    setEditNama(p.nama || "")
    setEditGambar(p.gambar_url || "")
    setEditHargaLite(String(p.harga_lite || 0))
    setEditHargaHealthy(String(p.harga_healthy || 0))
    setEditHargaSultan(String(p.harga_sultan || 0))
    setEditStokLite(String(p.stok_lite || 0))
    setEditStokHealthy(String(p.stok_healthy || 0))
    setEditStokSultan(String(p.stok_sultan || 0))
  }

  const simpanEdit = async () => {
    if (!editNama) return alert("Nama wajib isi")

    await updateDoc(doc(db, "products", editingId), {
      nama: editNama,
      gambar_url: editGambar,
      harga_lite: Number(editHargaLite),
      harga_healthy: Number(editHargaHealthy),
      harga_sultan: Number(editHargaSultan),
      stok_lite: Number(editStokLite),
      stok_healthy: Number(editStokHealthy),
      stok_sultan: Number(editStokSultan),
      punya_varian: true
    })

    setEditingId(null)
    fetchData()
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.replace("/login")
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#F97316] p-4 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-white font-bold text-2xl">TotalGo ADMIN 👑</h1>
          <button onClick={handleLogout} className="bg-white text-[#F97316] px-4 py-2 rounded-xl font-semibold">
            Logout
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-[#F97316] mb-3">Daftar Menu ({products.length})</h3>
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-md p-4 mb-3">
            {editingId === p.id? (
              <div className="space-y-2">
                <input value={editNama} onChange={e => setEditNama(e.target.value)} placeholder="Nama" className="w-full border p-2 rounded-xl font-bold" />
                <input value={editGambar} onChange={e => setEditGambar(e.target.value)} placeholder="/menu/menu-avocado.png" className="w-full border p-2 rounded-xl text-sm" />

                <div className="grid grid-cols-2 gap-2">
                  <input value={editHargaLite} onChange={e => setEditHargaLite(e.target.value)} type="number" placeholder="Harga Lite" className="border p-2 rounded-xl" />
                  <input value={editStokLite} onChange={e => setEditStokLite(e.target.value)} type="number" placeholder="Stok Lite" className="border p-2 rounded-xl" />

                  <input value={editHargaHealthy} onChange={e => setEditHargaHealthy(e.target.value)} type="number" placeholder="Harga Healthy" className="border p-2 rounded-xl" />
                  <input value={editStokHealthy} onChange={e => setEditStokHealthy(e.target.value)} type="number" placeholder="Stok Healthy" className="border p-2 rounded-xl" />

                  <input value={editHargaSultan} onChange={e => setEditHargaSultan(e.target.value)} type="number" placeholder="Harga Sultan" className="border p-2 rounded-xl" />
                  <input value={editStokSultan} onChange={e => setEditStokSultan(e.target.value)} type="number" placeholder="Stok Sultan" className="border p-2 rounded-xl" />
                </div>

                <div className="flex gap-2 mt-3">
                  <button onClick={simpanEdit} className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold">Simpan</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-300 py-2 rounded-xl font-semibold">Batal</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 items-start">
                <img src={p.gambar_url || '/menu-default.png'} className="w-20 h-20 rounded-xl object-cover bg-gray-100" onError={(e) => e.target.src = '/menu-default.png'} />
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{p.nama}</p>
                  <p className="text-xs text-gray-500">Lite: {formatIDR(p.harga_lite)} | Stok: {p.stok_lite}</p>
                  <p className="text-xs text-gray-500">Healthy: {formatIDR(p.harga_healthy)} | Stok: {p.stok_healthy}</p>
                  <p className="text-xs text-gray-500">Sultan: {formatIDR(p.harga_sultan)} | Stok: {p.stok_sultan}</p>
                  <p className="text-xs text-gray-400 mt-1">{p.gambar_url}</p>
                </div>
                <button onClick={() => mulaiEdit(p)} className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
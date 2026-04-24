import { useEffect, useState } from "react"
import { db, auth } from "../lib/firebase"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, onAuthStateChanged } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { useRouter } from "next/router"

export default function Admin() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Form tambah
  const [nama, setNama] = useState("")
  const [harga, setHarga] = useState("")
  const [varian, setVarian] = useState("")

  // State buat edit
  const [editingId, setEditingId] = useState(null)
  const [editNama, setEditNama] = useState("")
  const [editHarga, setEditHarga] = useState("")
  const [editVarian, setEditVarian] = useState("")

  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(Number(value) || 0)

  // Proteksi admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login")
        return
      }
      const token = await user.getIdTokenResult()
      if (token.claims.role!== 'admin') {
        router.replace("/kasir")
        return
      }
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

  const tambahProduk = async () => {
    if (!nama ||!harga) return alert("Nama & harga wajib isi")

    const hargaNumber = Number(harga)
    if (isNaN(hargaNumber)) return alert("Harga harus angka")

    let varianArr = []
    if (varian.trim()) {
      varianArr = varian.split(',').map(v => ({
        nama: v.trim(),
        harga: hargaNumber
      }))
    } else {
      varianArr = [
        { nama: "Lite Healthy", harga: hargaNumber },
        { nama: "Regular", harga: hargaNumber + 3000 },
        { nama: "Sultan", harga: hargaNumber + 7000 }
      ]
    }

    await addDoc(collection(db, "products"), {
      nama,
      harga: hargaNumber,
      img: "https://placehold.co/300x200",
      varian: varianArr
    })

    setNama("")
    setHarga("")
    setVarian("")
    fetchData()
  }

  const hapusProduk = async (id) => {
    if (!confirm("Yakin hapus produk ini?")) return
    await deleteDoc(doc(db, "products", id))
    fetchData()
  }

  const mulaiEdit = (p) => {
    setEditingId(p.id)
    setEditNama(p.nama)
    setEditHarga(String(p.harga))
    setEditVarian(p.varian?.map(v => v.nama).join(', ') || '')
  }

  const simpanEdit = async () => {
    if (!editNama ||!editHarga) return alert("Nama & harga wajib isi")

    const hargaNumber = Number(editHarga)
    if (isNaN(hargaNumber)) return alert("Harga harus angka")

    let varianArr = []
    if (editVarian.trim()) {
      varianArr = editVarian.split(',').map(v => ({
        nama: v.trim(),
        harga: hargaNumber
      }))
    }

    await updateDoc(doc(db, "products", editingId), {
      nama: editNama,
      harga: hargaNumber,
      varian: varianArr
    })

    setEditingId(null)
    fetchData()
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.replace("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F97316]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-[#F97316] p-4 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white font-bold text-2xl">TotalGo ADMIN 👑</h1>
            <p className="text-orange-100 text-sm">Manage Produk</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white text-[#F97316] px-4 py-2 rounded-xl font-semibold active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* FORM TAMBAH */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
          <h3 className="font-bold text-lg text-[#F97316] mb-3">Tambah Menu Baru</h3>
          <input
            placeholder="Nama Buah"
            value={nama}
            onChange={e => setNama(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 mb-3"
          />
          <input
            placeholder="Harga Dasar"
            type="number"
            value={harga}
            onChange={e => setHarga(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 mb-3"
          />
          <input
            placeholder="Varian: Avocado,Mango (kosongin = auto 3 varian)"
            value={varian}
            onChange={e => setVarian(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 mb-3"
          />
          <button
            onClick={tambahProduk}
            className="w-full bg-[#F97316] text-white py-3 rounded-xl font-bold hover:bg-orange-600 active:scale-95"
          >
            + Tambah Produk
          </button>
        </div>

        {/* LIST PRODUK */}
        <h3 className="font-bold text-lg text-[#F97316] mb-3">Daftar Menu ({products.length})</h3>
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-md p-4 mb-3">
            {editingId === p.id? (
              // MODE EDIT
              <div>
                <input
                  value={editNama}
                  onChange={e => setEditNama(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2 mb-2 font-bold"
                />
                <input
                  value={editHarga}
                  onChange={e => setEditHarga(e.target.value)}
                  type="number"
                  className="w-full border border-gray-300 rounded-xl p-2 mb-2"
                />
                <input
                  value={editVarian}
                  onChange={e => setEditVarian(e.target.value)}
                  placeholder="Varian pisah koma"
                  className="w-full border border-gray-300 rounded-xl p-2 mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={simpanEdit}
                    className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-xl font-semibold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              // MODE VIEW
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{p.nama}</p>
                  <p className="text-[#F97316] font-semibold">{formatIDR(p.harga)}</p>
                  <p className="text-xs text-gray-500">{p.varian?.map(v => v.nama).join(', ')}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => mulaiEdit(p)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold text-sm active:scale-95"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => hapusProduk(p.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold text-sm active:scale-95"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
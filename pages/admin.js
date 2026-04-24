import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"
import { db, app } from "../lib/firebase"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { useRouter } from "next/router"

export default function Admin() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({
    nama: "",
    gambar_url: "",
    punya_varian: false,
    harga_lite: "",
    stok_lite: "",
    harga_healthy: "",
    stok_healthy: "",
    harga_sultan: "",
    stok_sultan: ""
  })
  const [editId, setEditId] = useState(null)

  const auth = getAuth(app)
  const router = useRouter()

  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(Number(value) || 0)

  // CEK LOGIN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchProducts()
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, "products"))
    const data = snap.docs.map(doc => ({ id: doc.id,...doc.data() }))
    setProducts(data)
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const resetForm = () => {
    setForm({
      nama: "",
      gambar_url: "",
      punya_varian: false,
      harga_lite: "",
      stok_lite: "",
      harga_healthy: "",
      stok_healthy: "",
      harga_sultan: "",
      stok_sultan: ""
    })
    setEditId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const dataToSave = {
      nama: form.nama,
      gambar_url: form.gambar_url,
      punya_varian: form.punya_varian,
      harga_lite: Number(form.harga_lite) || 0,
      stok_lite: Number(form.stok_lite) || 0,
      harga_healthy: form.punya_varian ? Number(form.harga_healthy) || 0 : 0,
      stok_healthy: form.punya_varian ? Number(form.stok_healthy) || 0 : 0,
      harga_sultan: form.punya_varian ? Number(form.harga_sultan) || 0 : 0,
      stok_sultan: form.punya_varian ? Number(form.stok_sultan) || 0 : 0
    }

    if (editId) {
      await updateDoc(doc(db, "products", editId), dataToSave)
    } else {
      await addDoc(collection(db, "products"), dataToSave)
    }
    resetForm()
    fetchProducts()
  }

  const handleEdit = (p) => {
    setForm({
      nama: p.nama || "",
      gambar_url: p.gambar_url || "",
      punya_varian: p.punya_varian || false,
      harga_lite: p.harga_lite || "",
      stok_lite: p.stok_lite || "",
      harga_healthy: p.harga_healthy || "",
      stok_healthy: p.stok_healthy || "",
      harga_sultan: p.harga_sultan || "",
      stok_sultan: p.stok_sultan || ""
    })
    setEditId(p.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (confirm("Yakin hapus produk ini?")) {
      await deleteDoc(doc(db, "products", id))
      fetchProducts()
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#F97316]">Admin TotalGo</h1>
          <div className="flex gap-2">
            <button onClick={() => router.push('/kasir')} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">Kasir</button>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm">Logout</button>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md mb-6">
          <h2 className="font-bold text-lg mb-4">{editId ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Nama Produk"
              value={form.nama}
              onChange={e => setForm({...form, nama: e.target.value })}
              className="border p-3 rounded-lg"
              required
            />
            <input
              placeholder="URL Gambar"
              value={form.gambar_url}
              onChange={e => setForm({...form, gambar_url: e.target.value })}
              className="border p-3 rounded-lg"
            />
            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={form.punya_varian}
                onChange={e => setForm({...form, punya_varian: e.target.checked })}
              />
              <span className="text-sm font-semibold">Punya Varian Lite/Healthy/Sultan</span>
            </label>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Harga {form.punya_varian ? 'Lite' : ''}</label>
                <input
                  type="number"
                  placeholder="Harga"
                  value={form.harga_lite}
                  onChange={e => setForm({...form, harga_lite: e.target.value })}
                  className="border p-3 rounded-lg w-full"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Stok {form.punya_varian ? 'Lite' : ''}</label>
                <input
                  type="number"
                  placeholder="Stok"
                  value={form.stok_lite}
                  onChange={e => setForm({...form, stok_lite: e.target.value })}
                  className="border p-3 rounded-lg w-full"
                  required
                />
              </div>
            </div>

            {form.punya_varian && (
              <>
                <div>
                  <label className="text-xs text-gray-500">Harga Healthy</label>
                  <input
                    type="number"
                    placeholder="Harga Healthy"
                    value={form.harga_healthy}
                    onChange={e => setForm({...form, harga_healthy: e.target.value })}
                    className="border p-3 rounded-lg w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Stok Healthy</label>
                  <input
                    type="number"
                    placeholder="Stok Healthy"
                    value={form.stok_healthy}
                    onChange={e => setForm({...form, stok_healthy: e.target.value })}
                    className="border p-3 rounded-lg w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Harga Sultan</label>
                  <input
                    type="number"
                    placeholder="Harga Sultan"
                    value={form.harga_sultan}
                    onChange={e => setForm({...form, harga_sultan: e.target.value })}
                    className="border p-3 rounded-lg w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Stok Sultan</label>
                  <input
                    type="number"
                    placeholder="Stok Sultan"
                    value={form.stok_sultan}
                    onChange={e => setForm({...form, stok_sultan: e.target.value })}
                    className="border p-3 rounded-lg w-full"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-[#F97316] text-white px-6 py-3 rounded-xl font-bold">
              {editId ? 'Update' : 'Simpan'} Produk
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="bg-gray-300 px-6 py-3 rounded-xl">
                Batal
              </button>
            )}
          </div>
        </form>

        {/* LIST PRODUK */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">Daftar Produk</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Nama</th>
                  <th className="text-left p-3">Varian</th>
                  <th className="text-left p-3">Harga</th>
                  <th className="text-left p-3">Stok</th>
                  <th className="text-left p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-semibold">{p.nama}</td>
                    <td className="p-3">{p.punya_varian ? 'Lite/Healthy/Sultan' : 'Regular'}</td>
                    <td className="p-3">
                      {p.punya_varian ? (
                        <div className="text-xs">
                          <div>Lite: {formatIDR(p.harga_lite)}</div>
                          <div>Healthy: {formatIDR(p.harga_healthy)}</div>
                          <div>Sultan: {formatIDR(p.harga_sultan)}</div>
                        </div>
                      ) : formatIDR(p.harga_lite)}
                    </td>
                    <td className="p-3">
                      {p.punya_varian ? (
                        <div className="text-xs">
                          <div>Lite: {p.stok_lite}</div>
                          <div>Healthy: {p.stok_healthy}</div>
                          <div>Sultan: {p.stok_sultan}</div>
                        </div>
                      ) : p.stok_lite}
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleEdit(p)} className="text-blue-500 mr-3">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
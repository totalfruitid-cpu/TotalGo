import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
} from "firebase/firestore"
import { auth, db } from "../lib/firebase"

export default function Admin() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [nama, setNama] = useState("")
  const [harga, setHarga] = useState("")
  const [varian, setVarian] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return router.push("/login")

      setUser(currentUser)
      const token = await currentUser.getIdTokenResult()
      
      // 🔥 KALO BUKAN ADMIN, TENDANG KE /kasir
      if (token.claims.role!== "admin") {
        router.push("/kasir")
        return
      }
      
      setRole("admin")

      const q = query(collection(db, "products"), orderBy("nama"))
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
         ...doc.data()
        }))
        setProducts(data)
        setLoading(false)
      })

      return () => unsub()
    })

    return () => unsubscribe()
  }, [router])

  const handleTambah = async (e) => {
    e.preventDefault()
    if (!nama ||!harga) return alert("Nama & harga wajib")

    try {
      const basePrice = parseInt(harga)
      const varianArray = varian
       ? varian.split(",").map(v => ({
            nama: v.trim(),
            harga: basePrice
          }))
        : [
            { nama: "Lite Healthy", harga: basePrice },
            { nama: "Regular", harga: basePrice + 3000 },
            { nama: "Sultan", harga: basePrice + 7000 }
          ]

      await addDoc(collection(db, "products"), {
        nama,
        harga: basePrice,
        img: "https://placehold.co/300x200",
        varian: varianArray
      })

      setNama("")
      setHarga("")
      setVarian("")
    } catch (err) {
      alert("Gagal tambah: " + err.message)
    }
  }

  const handleHapus = async (id) => {
    if (!confirm("Yakin hapus?")) return
    await deleteDoc(doc(db, "products", id))
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/login")
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
      <div className="bg-[#F97316] p-4 sticky top-0 z-10 shadow-md">
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
        <form onSubmit={handleTambah} className="bg-white p-4 rounded-2xl shadow-md mb-6">
          <h2 className="font-bold text-lg mb-3">Tambah Menu Baru</h2>
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
            type="submit"
            className="w-full bg-[#F97316] text-white py-3 rounded-xl font-semibold hover:bg-orange-600 active:scale-95"
          >
            + Tambah Produk
          </button>
        </form>

        <h3 className="font-bold text-lg mb-3">Daftar Menu ({products.length})</h3>
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-md p-4 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <b className="text-lg">{p.nama}</b>
                <p className="text-[#F97316] font-semibold">Rp{p.harga?.toLocaleString('id-ID')}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {p.varian?.map(v => v.nama).join(", ")}
                </p>
              </div>
              <button 
                onClick={() => handleHapus(p.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
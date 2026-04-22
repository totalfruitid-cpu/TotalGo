import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  getDoc
} from "firebase/firestore"
import { auth, db } from "../lib/firebase"

export default function Admin() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [nama, setNama] = useState("")
  const [harga, setHarga] = useState("")
  const [varian, setVarian] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login"
        return
      }

      setUser(currentUser)

      const userDoc = await getDoc(doc(db, "users", currentUser.uid))

      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        window.location.href = "/login"
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
  }, [])

  const handleTambah = async (e) => {
    e.preventDefault()

    if (!nama || !harga) return alert("Nama & harga wajib")

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
    window.location.href = "/login"
  }

  if (loading) return <div>Loading...</div>
  if (role !== "admin") return <div>403 Forbidden</div>

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Admin Products</h1>

      <button onClick={handleLogout}>Logout</button>

      <form onSubmit={handleTambah} style={{ marginTop: 20 }}>
        <input
          placeholder="Nama"
          value={nama}
          onChange={e => setNama(e.target.value)}
        />

        <input
          placeholder="Harga"
          type="number"
          value={harga}
          onChange={e => setHarga(e.target.value)}
        />

        <input
          placeholder="Varian (opsional: Avocado,Mango)"
          value={varian}
          onChange={e => setVarian(e.target.value)}
        />

        <button type="submit">Tambah</button>
      </form>

      <h3>Products</h3>

      {products.map(p => (
        <div key={p.id} style={{ border: "1px solid #ddd", margin: 10, padding: 10 }}>
          <b>{p.nama}</b>
          <p>Rp{p.harga}</p>

          <p>
            {p.varian?.map(v => v.nama).join(", ")}
          </p>

          <button onClick={() => handleHapus(p.id)}>
            Hapus
          </button>
        </div>
      ))}
    </div>
  )
}
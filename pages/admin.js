import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "firebase/firestore"

export default function Admin() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [nama, setNama] = useState("")
  const [hargaLite, setHargaLite] = useState("")
  const [hargaHealthy, setHargaHealthy] = useState("")
  const [hargaSultan, setHargaSultan] = useState("")

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"))
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  const tambahProduk = async () => {
    try {
      if (!nama.trim()) return alert("Nama wajib")

      await addDoc(collection(db, "products"), {
        nama: nama.trim(),
        harga_lite: Number(hargaLite || 0),
        harga_healthy: Number(hargaHealthy || 0),
        harga_sultan: Number(hargaSultan || 0),
      })

      setNama("")
      setHargaLite("")
      setHargaHealthy("")
      setHargaSultan("")

      loadProducts()
    } catch (err) {
      alert("Gagal tambah produk: " + err.message)
    }
  }

  const hapusProduk = async (id) => {
    if (!confirm("Hapus produk?")) return

    try {
      await deleteDoc(doc(db, "products", id))
      loadProducts()
    } catch (err) {
      alert("Gagal hapus: " + err.message)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <h1>ADMIN</h1>

      <h2>Tambah Produk</h2>

      <input
        placeholder="Nama Produk"
        value={nama}
        onChange={e => setNama(e.target.value)}
      />

      <input
        placeholder="Harga Lite"
        value={hargaLite}
        onChange={e => setHargaLite(e.target.value)}
      />

      <input
        placeholder="Harga Healthy"
        value={hargaHealthy}
        onChange={e => setHargaHealthy(e.target.value)}
      />

      <input
        placeholder="Harga Sultan"
        value={hargaSultan}
        onChange={e => setHargaSultan(e.target.value)}
      />

      <br /><br />

      <button onClick={tambahProduk}>Tambah</button>

      <hr />

      <h2>List Produk</h2>

      {products.map(p => (
        <div key={p.id} style={{
          border: "1px solid #ccc",
          marginBottom: 10,
          padding: 10
        }}>
          <h3>{p.nama}</h3>
          <p>Lite: {p.harga_lite}</p>
          <p>Healthy: {p.harga_healthy}</p>
          <p>Sultan: {p.harga_sultan}</p>

          <button onClick={() => hapusProduk(p.id)}>
            Hapus
          </button>
        </div>
      ))}
    </div>
  )
}
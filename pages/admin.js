// pages/admin.js
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
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [nama, setNama] = useState("")
  const [harga, setHarga] = useState("")
  const [varian, setVarian] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setRole("admin")

          const q = query(collection(db, "menu"), orderBy("nama"))
          const unsubMenu = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            setMenu(data)
            setLoading(false)
          })

          return () => unsubMenu()
        } else {
          window.location.href = "/login"
        }
      } else {
        window.location.href = "/login"
      }
    })
    return () => unsubscribe()
  }, [])

  const handleTambah = async (e) => {
    e.preventDefault()
    if (!nama || !harga) return alert("Nama & harga wajib diisi")
    
    try {
      await addDoc(collection(db, "menu"), {
        nama: nama,
        harga: parseInt(harga),
        varian: varian ? varian : null,
        stok: true
      })
      setNama("")
      setHarga("")
      setVarian("")
    } catch (err) {
      alert("Gagal tambah: " + err.message)
    }
  }

  const handleHapus = async (id) => {
    if (!confirm("Yakin hapus menu ini?")) return
    try {
      await deleteDoc(doc(db, "menu", id))
    } catch (err) {
      alert("Gagal hapus: " + err.message)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = "/login"
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>
  if (role !== "admin") return <div style={{ padding: 20 }}>403 Forbidden</div>

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Admin Menu</h1>
        <button 
          onClick={handleLogout}
          style={{ padding: "8px 16px", background: "#f44336", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          Logout
        </button>
      </div>
      
      <p>Login sebagai: {user?.email}</p>

      <form onSubmit={handleTambah} style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3>Tambah Menu Baru</h3>
        <input
          type="text"
          placeholder="Nama Menu*"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 8, boxSizing: "border-box", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <input
          type="number"
          placeholder="Harga*"
          value={harga}
          onChange={(e) => setHarga(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 8, boxSizing: "border-box", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <input
          type="text"
          placeholder="Varian (Opsional, pisah koma: Dingin,Panas)"
          value={varian}
          onChange={(e) => setVarian(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12, boxSizing: "border-box", borderRadius: 4, border: "1px solid #ccc" }}
        />
        <button 
          type="submit"
          style={{ width: "100%", padding: 12, background: "#4CAF50", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          Tambah Menu
        </button>
      </form>

      <h3>Daftar Menu:</h3>
      {menu.length === 0 ? (
        <p>Belum ada menu</p>
      ) : (
        <div>
          {menu.map((item) => (
            <div key={item.id} style={{ 
              border: "1px solid #ddd", 
              padding: 12, 
              marginBottom: 10, 
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: "bold" }}>{item.nama}</p>
                <p style={{ margin: "4px 0 0", color: "#555" }}>
                  Rp{item.harga?.toLocaleString("id-ID")}
                  {item.varian && ` - Varian: ${item.varian}`} 
                </p>
              </div>
              <button 
                onClick={() => handleHapus(item.id)}
                style={{ padding: "6px 12px", background: "#ff4444", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
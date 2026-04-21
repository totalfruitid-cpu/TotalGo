// pages/store.js - VERSI SULTAN BACA STRUKTUR LU
import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [loading, setLoading] = useState(true)
  const [nama, setNama] = useState("")
  const [alamat, setAlamat] = useState("")
  const [noHp, setNoHp] = useState("")
  const [metode, setMetode] = useState("COD")
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [selectedVarian, setSelectedVarian] = useState({})

  useEffect(() => {
    async function fetchProducts() {
      try {
        const querySnapshot = await getDocs(collection(db, "products"))
        const data = querySnapshot.docs.map((doc) => {
          const p = doc.data() || {}

          // BACA STRUKTUR PUNYA LU: harga_lite, harga_healthy, harga_sultan
          const varianFix = []
          if (p.punya_varian) {
            if (p.harga_lite) varianFix.push({ nama: "Lite", harga: Number(p.harga_lite) || 0, stok: Number(p.stok_lite) || 0 })
            if (p.harga_healthy) varianFix.push({ nama: "Healthy", harga: Number(p.harga_healthy) || 0, stok: Number(p.stok_healthy) || 0 })
            if (p.harga_sultan) varianFix.push({ nama: "Sultan", harga: Number(p.harga_sultan) || 0, stok: Number(p.stok_sultan) || 0 })
          }

          // Kalo gak punya varian, pake harga & stok utama
          if (varianFix.length === 0) {
            varianFix.push({ nama: "Regular", harga: Number(p.harga) || 0, stok: Number(p.stok) || 0 })
          }

          return {
            id: doc.id,
            nama: String(p.nama || "Produk Misterius"),
            img: String(p.gambar_url || "https://placehold.co/200x200/f97316/fff?text=TotalGo"),
            varian: varianFix,
            totalStok: varianFix.reduce((sum, v) => sum + v.stok, 0)
          }
        })
        setProducts(data)
      } catch (err) {
        console.error("Firebase error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const getHarga = (product) => {
    const index = selectedVarian[product.id] || 0
    return product?.varian?.[index]?.harga || 0
  }

  const getStokVarian = (product) => {
    const index = selectedVarian[product.id] || 0
    return product?.varian?.[index]?.stok || 0
  }

  const getNamaVarian = (product) => {
    const index = selectedVarian[product.id] || 0
    return product?.varian?.[index]?.nama || "Regular"
  }

  const addToCart = (product) => {
    if (!product) return
    const harga = getHarga(product)
    const namaVarian = getNamaVarian(product)
    const stokVarian = getStokVarian(product)
    const cartKey = `${product.id}_${namaVarian}`

    setCart((prev) => {
      const qty = prev[cartKey]?.qty || 0
      if (qty >= stokVarian) {
        alert(`Stok ${product.nama} ${namaVarian} tinggal ${stokVarian} bos`)
        return prev
      }
      return {
  ...prev,
        [cartKey]: { id: product.id, nama: product.nama, varian: namaVarian, harga: harga, img: product.img, qty: qty + 1 },
      }
    })
  }

  const removeFromCart = (cartKey) => {
    setCart((prev) => {
      const qty = prev[cartKey]?.qty || 0
      if (qty <= 1) {
        const newCart = {...prev }
        delete newCart[cartKey]
        return newCart
      }
      return {...prev, [cartKey]: {...prev[cartKey], qty: qty - 1 } }
    })
  }

  const total = Object.values(cart).reduce((sum, item) => sum + item.harga * item.qty, 0)
  const ongkir = metode === "COD"? 5000 : 0
  const grandTotal = total + ongkir

  const checkout = async () => {
    if (!nama ||!alamat ||!noHp) return alert("Isi Nama, Alamat, & No HP dulu bos")
    if (Object.keys(cart).length === 0) return alert("Keranjang kosong")
    if (grandTotal === 0) return alert("Total 0. Pilih produk yg ada harganya.")

    setLoadingOrder(true)
    try {
      const items = Object.values(cart).map((item) => ({
        id: item.id, nama: item.nama, varian: item.varian, harga: item.harga, qty: item.qty,
      }))
      await addDoc(collection(db, "orders"), {
        nama, alamat, noHp, items, total, ongkir, grandTotal, metode, status: "baru", createdAt: serverTimestamp(),
      })
      alert("Order berhasil! Driver otw 🛵")
      setCart({}); setNama(""); setAlamat(""); setNoHp("")
    } catch (err) {
      console.error("Gagal checkout:", err)
      alert("Gagal checkout. Cek Rules: total > 0")
    } finally {
      setLoadingOrder(false)
    }
  }

  if (loading) return <div style={styles.loading}>Sabar bos, lagi manasin wajan...</div>

  return (
    <>
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'); body { font-family: 'Poppins', sans-serif; background: #f0f2f5; margin: 0; }`}</style>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.logo}>TotalGo Food 🛵</h1>
          <p style={styles.tagline}>Laper? Pesan Sekarang, COD Bisa!</p>
        </header>
        <h2 style={styles.title}>🔥 Menu Andalan</h2>
        <div style={styles.grid}>
          {products.map((p) => (
            <div key={p.id} style={styles.card}>
              <img src={p.img} alt={p.nama} style={styles.cardImg} />
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{p.nama}</h3>
                <select style={styles.select} value={selectedVarian[p.id] || 0} onChange={(e) => setSelectedVarian({...selectedVarian, [p.id]: Number(e.target.value)})}>
                  {p.varian.map((v, i) => (<option key={i} value={i}>{v.nama} - Rp{v.harga.toLocaleString("id-ID")} | Stok: {v.stok}</option>))}
                </select>
                <div style={styles.cardFooter}>
                  <span style={styles.price}>Rp{getHarga(p).toLocaleString("id-ID")}</span>
                  <button style={getStokVarian(p) === 0 || getHarga(p) === 0? styles.btnDisabled : styles.btnAdd} onClick={() => addToCart(p)} disabled={getStokVarian(p) === 0 || getHarga(p) === 0}>
                    {getStokVarian(p) === 0? "Habis" : "+ Keranjang"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={styles.cartSection}>
          <h2 style={styles.title}>🛒 Keranjang Lu</h2>
          {Object.keys(cart).length === 0? (
            <div style={styles.cartEmpty}>Keranjang masih kosong bos, isi dulu!</div>
          ) : (
            <>
              {Object.entries(cart).map(([key, item]) => (
                <div key={key} style={styles.cartItem}>
                  <img src={item.img} style={styles.cartImg} />
                  <div style={styles.cartInfo}>
                    <b>{item.nama}</b>
                    <small>{item.varian}</small>
                    <span>Rp{(item.harga * item.qty).toLocaleString("id-ID")}</span>
                  </div>
                  <div style={styles.cartQty}>
                    <button style={styles.btnQty} onClick={() => removeFromCart(key)}>-</button>
                    <span>{item.qty}</span>
                    <button style={styles.btnQty} onClick={() => {
                      const prod = products.find(p => p.id === item.id)
                      if (!prod) return
                      const index = prod.varian.findIndex(v => v.nama === item.varian)
                      setSelectedVarian({...selectedVarian, [item.id]: index})
                      addToCart(prod)
                    }}>+</button>
                  </div>
                </div>
              ))}
              <div style={styles.summary}>
                <div style={styles.summaryRow}><span>Subtotal</span><span>Rp{total.toLocaleString("id-ID")}</span></div>
                <div style={styles.summaryRow}><span>Ongkir ({metode})</span><span>Rp{ongkir.toLocaleString("id-ID")}</span></div>
                <div style={styles.summaryTotal}><span>TOTAL BAYAR</span><span>Rp{grandTotal.toLocaleString("id-ID")}</span></div>
              </div>
              <div style={styles.form}>
                <input type="text" placeholder="Nama Penerima" value={nama} onChange={(e) => setNama(e.target.value)} style={styles.input} />
                <input type="text" placeholder="Alamat Lengkap" value={alamat} onChange={(e) => setAlamat(e.target.value)} style={styles.input} />
                <input type="tel" placeholder="No HP / WA" value={noHp} onChange={(e) => setNoHp(e.target.value)} style={styles.input} />
                <select value={metode} onChange={(e) => setMetode(e.target.value)} style={styles.input}>
                  <option value="COD">COD - Bayar di Tempat</option>
                  <option value="Transfer">Transfer Bank</option>
                </select>
                <button onClick={checkout} disabled={loadingOrder || grandTotal === 0} style={styles.btnCheckout}>
                  {loadingOrder? "NGEBUT..." : `PESAN SEKARANG - Rp${grandTotal.toLocaleString("id-ID")}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

const styles = {
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: 24, color: "#f97316", fontWeight: 700 },
  container: { maxWidth: 800, margin: "0 auto", padding: 16 },
  header: { background: "linear-gradient(135deg, #f97316, #ea580c)", color: "white", padding: "24px 16px", borderRadius: 16, textAlign: "center", marginBottom: 24 },
  logo: { margin: 0, fontSize: 32, fontWeight: 700 },
  tagline: { margin: "4px 0 0", opacity: 0.9 },
  title: { fontSize: 24, fontWeight: 700, color: "#1f2937", marginBottom: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 32 },
  card: { background: "white", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden", display: "flex", flexDirection: "column" },
  cardImg: { width: "100%", height: 140, objectFit: "cover" },
  cardBody: { padding: 12, display: "flex", flexDirection: "column", flexGrow: 1 },
  cardTitle: { margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "#111827" },
  select: { width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12, fontFamily: "Poppins" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" },
  price: { fontSize: 18, fontWeight: 700, color: "#ea580c" },
  btnAdd: { background: "#f97316", color: "white", border: "none", padding: "8px 12px", borderRadius: 8, fontWeight: 600, cursor: "pointer" },
  btnDisabled: { background: "#9ca3af", color: "white", border: "none", padding: "8px 12px", borderRadius: 8, fontWeight: 600, cursor: "not-allowed" },
  cartSection: { background: "white", padding: 16, borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
  cartEmpty: { textAlign: "center", padding: 20, color: "#6b7280" },
  cartItem: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  cartImg: { width: 50, height: 50, borderRadius: 8, objectFit: "cover" },
  cartInfo: { flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 },
  cartQty: { display: "flex", alignItems: "center", gap: 12 },
  btnQty: { width: 28, height: 28, borderRadius: "50%", border: "1px solid #ddd", background: "#f9fafb", cursor: "pointer", fontWeight: 700 },
  summary: { marginTop: 16, paddingTop: 16, borderTop: "2px dashed #e5e7eb" },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: 8, color: "#4b5563" },
  summaryTotal: { display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, color: "#1f2937", marginTop: 8 },
  form: { display: "flex", flexDirection: "column", gap: 12, marginTop: 20 },
  input: { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box", fontSize: 14, fontFamily: "Poppins" },
  btnCheckout: { background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", border: "none", padding: 16, borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer" },
}
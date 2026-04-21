// pages/store.js
import { useEffect, useState } from "react"
import { db } from "../lib/firebase" // <-- PASTIIN ADA /lib
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [loading, setLoading] = useState(true)
  const [nama, setNama] = useState("")
  const [loadingOrder, setLoadingOrder] = useState(false)

  // Ambil produk dari Firestore
  useEffect(() => {
    async function fetchProducts() {
      try {
        const querySnapshot = await getDocs(collection(db, "products"))
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
         ...doc.data(),
        }))
        setProducts(data)
      } catch (err) {
        console.error("Gagal ambil produk:", err)
        alert("Gagal ambil produk. Cek Console F12.")
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Tambah ke keranjang
  const addToCart = (product) => {
    setCart((prev) => {
      const qty = prev[product.id]?.qty || 0
      // Cek stok client-side doang, gak ngerubah DB
      if (qty >= product.stok) {
        alert(`Stok ${product.nama} cuma ${product.stok}`)
        return prev
      }
      return {
       ...prev,
        [product.id]: {
         ...product,
          qty: qty + 1,
        },
      }
    })
  }

  // Kurangin dari keranjang
  const removeFromCart = (productId) => {
    setCart((prev) => {
      const qty = prev[productId]?.qty || 0
      if (qty <= 1) {
        const newCart = {...prev }
        delete newCart[productId]
        return newCart
      }
      return {
       ...prev,
        [productId]: {
         ...prev[productId],
          qty: qty - 1,
        },
      }
    })
  }

  // Total harga
  const total = Object.values(cart).reduce(
    (sum, item) => sum + item.harga * item.qty,
    0
  )

  // Checkout - CUMA BIKIN ORDER, GAK NGURANGIN STOK
  const checkout = async () => {
    if (!nama) return alert("Isi nama dulu bos")
    if (Object.keys(cart).length === 0) return alert("Keranjang kosong")

    setLoadingOrder(true)
    try {
      const items = Object.values(cart).map((item) => ({
        id: item.id,
        nama: item.nama,
        harga: item.harga,
        qty: item.qty,
      }))

      await addDoc(collection(db, "orders"), {
        nama,
        items,
        total,
        status: "baru",
        createdAt: serverTimestamp(),
      })

      alert("Order berhasil! Cek Firestore > orders")
      setCart({})
      setNama("")
    } catch (err) {
      console.error("Gagal checkout:", err)
      alert("Gagal checkout. Cek rules atau Console F12.")
    } finally {
      setLoadingOrder(false)
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>TotalGo Store - ShopeeFood Mode</h1>

      <h2>Produk</h2>
      {products.length === 0? (
        <p>Produk kosong. Isi dulu di Firestore → products</p>
      ) : (
        products.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <b>{p.nama}</b> - Rp{p.harga.toLocaleString("id-ID")}
              <br />
              <small>Stok: {p.stok}</small>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => removeFromCart(p.id)}>-</button>
              <span>{cart[p.id]?.qty || 0}</span>
              <button onClick={() => addToCart(p)} disabled={p.stok === 0}>
                +
              </button>
            </div>
          </div>
        ))
      )}

      <hr style={{ margin: "20px 0" }} />

      <h2>Keranjang</h2>
      {Object.keys(cart).length === 0? (
        <p>Keranjang kosong</p>
      ) : (
        <>
          {Object.values(cart).map((item) => (
            <div key={item.id}>
              {item.nama} x {item.qty} = Rp
              {(item.harga * item.qty).toLocaleString("id-ID")}
            </div>
          ))}
          <h3>Total: Rp{total.toLocaleString("id-ID")}</h3>
          <input
            type="text"
            placeholder="Nama lu bos"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            style={{ padding: 8, width: "100%", marginBottom: 10 }}
          />
          <button
            onClick={checkout}
            disabled={loadingOrder}
            style={{ padding: 10, width: "100%" }}
          >
            {loadingOrder? "Proses..." : "Checkout"}
          </button>
        </>
      )}
    </div>
  )
}
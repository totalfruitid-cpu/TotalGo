import { useState, useEffect } from 'react'
import Head from 'next/head'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc
} from "firebase/firestore"

const BASE_URL_GAMBAR = "/menu/";

export default function Kasir() {
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // =========================
  // 🔐 SECURITY CHECK KASIR
  // =========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        window.location.href = '/login'
        return
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid))

        if (!snap.exists()) {
          await signOut(auth)
          window.location.href = '/login'
          return
        }

        const data = snap.data()

        if (data.role!== "kasir" && data.role!== "admin") {
          await signOut(auth)
          window.location.href = '/login'
          return
        }

        setSession(user)
        loadProducts()

      } catch (err) {
        console.error(err)
        window.location.href = '/login'
      }

      setLoading(false)
    })

    return () => unsub()
  }, [])

  // =========================
  // LOAD PRODUCTS
  // =========================
  const loadProducts = async () => {
    const q = query(
      collection(db, 'products'),
      orderBy('nama', 'asc')
    )

    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id,...d.data() }))
    setProducts(data)
  }

  // =========================
  // CART LOGIC
  // =========================
  const addToCart = (product, varian = null) => {
    const harga = varian === 'lite'? product.harga_lite
                : varian === 'healthy'? product.harga_healthy
                : varian === 'sultan'? product.harga_sultan
                : product.harga_lite || 0

    const namaItem = varian? `${product.nama} - ${varian}` : product.nama

    const exist = cart.find(item => item.id === product.id && item.varian === varian)

    if (exist) {
      setCart(cart.map(item =>
        item.id === product.id && item.varian === varian
        ? {...item, qty: item.qty + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        nama: namaItem,
        varian: varian,
        harga: harga,
        qty: 1
      }])
    }
  }

  const updateQty = (id, varian, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(item =>!(item.id === id && item.varian === varian)))
    } else {
      setCart(cart.map(item =>
        item.id === id && item.varian === varian
        ? {...item, qty: qty }
          : item
      ))
    }
  }

  const removeFromCart = (id, varian) => {
    setCart(cart.filter(item =>!(item.id === id && item.varian === varian)))
  }

  // Hitung total otomatis
  useEffect(() => {
    const sum = cart.reduce((acc, item) => acc + (item.harga * item.qty), 0)
    setTotal(sum)
  }, [cart])

  // =========================
  // CHECKOUT
  // =========================
  const checkout = async () => {
    if (cart.length === 0) {
      alert('Keranjang kosong')
      return
    }

    try {
      // 1. Simpan transaksi
      await addDoc(collection(db, 'transaksi'), {
        items: cart,
        total: total,
        kasir_email: session.email,
        created_at: serverTimestamp()
      })

      // 2. Kurangi stok
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id)
        const productSnap = await getDoc(productRef)
        const productData = productSnap.data()

        if (item.varian) {
          const fieldStok = `stok_${item.varian}`
          const stokBaru = (productData[fieldStok] || 0) - item.qty
          await updateDoc(productRef, { [fieldStok]: stokBaru < 0? 0 : stokBaru })
        } else {
          const stokBaru = (productData.stok || 0) - item.qty
          await updateDoc(productRef, { stok: stokBaru < 0? 0 : stokBaru })
        }
      }

      alert(`Transaksi berhasil! Total: Rp${total.toLocaleString('id-ID')}`)
      setCart([])
      loadProducts()

    } catch (err) {
      alert('Gagal checkout: ' + err.message)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = '/login'
  }

  if (loading) return <p style={{padding:20, background:'#000', color:'#fff', minHeight:'100vh'}}>Loading...</p>

  return (
    <>
      <Head>
        <title>TotalGo Kasir</title>
      </Head>

      <div style={{padding:20, background:'#000', color:'#fff', minHeight:'100vh', fontFamily:'sans-serif'}}>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
          <h1>Kasir TotalGo</h1>
          <div>
            <span style={{marginRight:16}}>{session?.email}</span>
            <button onClick={handleLogout} style={{padding:'8px 16px', background:'#333', color:'#fff', border:'none', borderRadius:6}}>Logout</button>
          </div>
        </div>

        <div style={{display:'flex', gap:20, flexWrap:'wrap'}}>

          {/* LIST PRODUK */}
          <div style={{flex:'2', background:'#111', padding:20, borderRadius:12, minWidth:300}}>
            <h2>Menu</h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16}}>
              {products.map(p => (
                <div key={p.id} style={{background:'#222', padding:12, borderRadius:8}}>
                  {p.gambar_url && <img src={p.gambar_url} alt={p.nama} style={{width:'100%', height:120, objectFit:'cover', borderRadius:6, marginBottom:8}} />}
                  <b>{p.nama}</b>

                  {p.punya_varian? (
                    <div style={{marginTop:8}}>
                      <button onClick={() => addToCart(p, 'lite')} style={btnStyle}>Lite: Rp{(p.harga_lite || 0).toLocaleString('id-ID')}</button>
                      <button onClick={() => addToCart(p, 'healthy')} style={btnStyle}>Healthy: Rp{(p.harga_healthy || 0).toLocaleString('id-ID')}</button>
                      <button onClick={() => addToCart(p, 'sultan')} style={btnStyle}>Sultan: Rp{(p.harga_sultan || 0).toLocaleString('id-ID')}</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(p)} style={{...btnStyle, marginTop:8}}>
                      Rp{(p.harga_lite || 0).toLocaleString('id-ID')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KERANJANG */}
          <div style={{flex:'1', background:'#111', padding:20, borderRadius:12, minWidth:300}}>
            <h2>Keranjang</h2>

            {cart.length === 0? <p>Kosong</p> : (
              <>
                {cart.map(item => (
                  <div key={`${item.id}-${item.varian}`} style={{borderBottom:'1px solid #333', padding:'8px 0'}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <span>{item.nama}</span>
                      <button onClick={() => removeFromCart(item.id, item.varian)} style={{background:'none', border:'none', color:'#ff4d4d', cursor:'pointer'}}>X</button>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4}}>
                      <div>
                        <button onClick={() => updateQty(item.id, item.varian, item.qty - 1)} style={qtyBtn}>-</button>
                        <span style={{margin:'0 8px'}}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.varian, item.qty + 1)} style={qtyBtn}>+</button>
                      </div>
                      <span>Rp{(item.harga * item.qty).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}

                <div style={{marginTop:20, paddingTop:12, borderTop:'2px solid #333'}}>
                  <h3>Total: Rp{total.toLocaleString('id-ID')}</h3>
                  <button onClick={checkout} style={{width:'100%', padding:'12px', background:'#fff', color:'#000', border:'none', borderRadius:6, fontWeight:'bold', marginTop:8}}>
                    Bayar
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

const btnStyle = {
  display:'block',
  width:'100%',
  padding:'6px',
  margin:'4px 0',
  background:'#333',
  color:'#fff',
  border:'none',
  borderRadius:4,
  cursor:'pointer',
  fontSize:12
}

const qtyBtn = {
  padding:'2px 8px',
  background:'#333',
  color:'#fff',
  border:'none',
  borderRadius:4,
  cursor:'pointer'
}
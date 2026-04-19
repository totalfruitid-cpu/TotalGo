import { useState, useEffect } from 'react'
import Head from 'next/head'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  getDoc
} from "firebase/firestore"

const BASE_URL_GAMBAR = "/menu/";

export default function Admin() {
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    id: '', nama: '', punya_varian: true,
    harga_lite: '', harga_healthy: '', harga_sultan: '',
    stok: '', stok_lite: '', stok_healthy: '', stok_sultan: '',
    deskripsi: '', gambar_url: ''
  })

  // =========================
  // 🔐 SECURITY CHECK ADMIN
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

        if (data.role!== "admin") {
          await signOut(auth)
          window.location.href = '/login'
          return
        }

        setSession(user)
        loadProducts()

      } catch (err) {
        console.error(err)
        await signOut(auth)
        window.location.href = '/login'
      }

      setLoading(false)
    })

    return () => unsub()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = '/login'
  }

  // =========================
  // LOAD PRODUCTS
  // =========================
  const loadProducts = async () => {
    const q = query(
      collection(db, 'products'),
      orderBy('created_at', 'desc')
    )

    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id,...d.data() }))
    setProducts(data)
  }

  // =========================
  // SAVE PRODUCT
  // =========================
  const saveProduct = async (e) => {
    e.preventDefault()

    const linkLengkap = form.gambar_url
     ? BASE_URL_GAMBAR + form.gambar_url
      : null

    const payload = {
      nama: form.nama,
      punya_varian: form.punya_varian,
      harga_lite: parseInt(form.harga_lite) || 0,
      harga_healthy: parseInt(form.harga_healthy) || 0,
      harga_sultan: parseInt(form.harga_sultan) || 0,
      deskripsi: form.deskripsi,
      gambar_url: linkLengkap
    }

    if (form.punya_varian) {
      payload.stok_lite = parseInt(form.stok_lite) || 0
      payload.stok_healthy = parseInt(form.stok_healthy) || 0
      payload.stok_sultan = parseInt(form.stok_sultan) || 0
    } else {
      payload.stok = parseInt(form.stok) || 0
    }

    try {
      if (form.id) {
        await updateDoc(doc(db, 'products', form.id), payload)
      } else {
        payload.created_at = serverTimestamp()
        await addDoc(collection(db, 'products'), payload)
      }

      resetForm()
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  const resetForm = () => {
    setForm({
      id: '', nama: '', punya_varian: true,
      harga_lite: '', harga_healthy: '', harga_sultan: '',
      stok: '', stok_lite: '', stok_healthy: '', stok_sultan: '',
      deskripsi: '', gambar_url: ''
    })
  }

  const deleteProduct = async (id) => {
    if (!confirm('Hapus produk?')) return
    await deleteDoc(doc(db, 'products', id))
    loadProducts()
  }

  const editProduct = (p) => {
    setForm({
      id: p.id,
      nama: p.nama,
      punya_varian: p.punya_varian,
      harga_lite: p.harga_lite,
      harga_healthy: p.harga_healthy,
      harga_sultan: p.harga_sultan,
      stok: p.stok || '',
      stok_lite: p.stok_lite || '',
      stok_healthy: p.stok_healthy || '',
      stok_sultan: p.stok_sultan || '',
      deskripsi: p.deskripsi,
      gambar_url: p.gambar_url?.replace(BASE_URL_GAMBAR, '') || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <p style={{padding:20, background:'#000', color:'#fff', minHeight:'100vh'}}>Loading...</p>

  return (
    <>
      <Head>
        <title>TotalGo Admin</title>
      </Head>

      <div style={{padding:20, background:'#000', color:'#fff', minHeight:'100vh', fontFamily:'sans-serif'}}>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
          <h1>Admin Dashboard TotalGo</h1>
          <div>
            <span style={{marginRight:16}}>{session?.email}</span>
            <button onClick={handleLogout} style={{padding:'8px 16px', background:'#333', color:'#fff', border:'none', borderRadius:6}}>Logout</button>
          </div>
        </div>

        <div style={{background:'#111', padding:20, borderRadius:12, marginBottom:20}}>
          <h2>Tambah/Edit Produk</h2>

          <form onSubmit={saveProduct}>
            <input
              placeholder="Nama Produk"
              value={form.nama}
              onChange={e => setForm({...form, nama: e.target.value })}
              style={inputStyle}
            />

            <label style={{display:'flex', alignItems:'center', margin:'10px 0'}}>
              <input
                type="checkbox"
                checked={form.punya_varian}
                onChange={e => setForm({...form, punya_varian: e.target.checked })}
                style={{marginRight:8}}
              />
              Punya Varian Lite/Healthy/Sultan
            </label>

            {form.punya_varian? (
              <>
                <input placeholder="Harga Lite" type="number" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value })} style={inputStyle} />
                <input placeholder="Harga Healthy" type="number" value={form.harga_healthy} onChange={e => setForm({...form, harga_healthy: e.target.value })} style={inputStyle} />
                <input placeholder="Harga Sultan" type="number" value={form.harga_sultan} onChange={e => setForm({...form, harga_sultan: e.target.value })} style={inputStyle} />
                <input placeholder="Stok Lite" type="number" value={form.stok_lite} onChange={e => setForm({...form, stok_lite: e.target.value })} style={inputStyle} />
                <input placeholder="Stok Healthy" type="number" value={form.stok_healthy} onChange={e => setForm({...form, stok_healthy: e.target.value })} style={inputStyle} />
                <input placeholder="Stok Sultan" type="number" value={form.stok_sultan} onChange={e => setForm({...form, stok_sultan: e.target.value })} style={inputStyle} />
              </>
            ) : (
              <>
                <input placeholder="Harga" type="number" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value })} style={inputStyle} />
                <input placeholder="Stok" type="number" value={form.stok} onChange={e => setForm({...form, stok: e.target.value })} style={inputStyle} />
              </>
            )}

            <textarea
              placeholder="Deskripsi"
              value={form.deskripsi}
              onChange={e => setForm({...form, deskripsi: e.target.value })}
              style={{...inputStyle, height:80}}
            />

            <input
              placeholder="Nama file gambar: contoh.jpg"
              value={form.gambar_url}
              onChange={e => setForm({...form, gambar_url: e.target.value })}
              style={inputStyle}
            />

            <button style={{padding:'10px 20px', background:'#fff', color:'#000', border:'none', borderRadius:6, marginTop:10}}>
              {form.id? 'Update' : 'Simpan'} Produk
            </button>
            {form.id && <button type="button" onClick={resetForm} style={{padding:'10px 20px', background:'#333', color:'#fff', border:'none', borderRadius:6, marginLeft:10}}>Batal</button>}
          </form>
        </div>

        <div style={{background:'#111', padding:20, borderRadius:12}}>
          <h2>List Produk</h2>
          {products.map(p => (
            <div key={p.id} style={{borderBottom:'1px solid #333', padding:'12px 0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <b>{p.nama}</b>
                <p style={{margin:'4px 0 0 0', fontSize:12, color:'#aaa'}}>
                  {p.punya_varian
                    ? `Lite: ${p.harga_lite} | Healthy: ${p.harga_healthy} | Sultan: ${p.harga_sultan}`
                    : `Harga: ${p.harga_lite} | Stok: ${p.stok}`
                  }
                </p>
              </div>
              <div>
                <button onClick={() => editProduct(p)} style={{marginRight:8, padding:'6px 12px', background:'#333', color:'#fff', border:'none', borderRadius:6}}>Edit</button>
                <button onClick={() => deleteProduct(p.id)} style={{padding:'6px 12px', background:'#8B0000', color:'#fff', border:'none', borderRadius:6}}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const inputStyle = {
  display:'block',
  margin:'10px 0',
  padding:10,
  width:'100%',
  background:'#222',
  border:'1px solid #333'
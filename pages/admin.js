import { useState, useEffect } from 'react'
import Head from 'next/head'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, orderBy, query, serverTimestamp, getDoc
} from "firebase/firestore"

const BASE_URL_GAMBAR = "/menu/";

export default function Admin() {
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    id: '', nama: '', punya_varian: true,
    harga_lite: '', harga_healthy: '', harga_sultan: '',
    stok: '', stok_lite: '', stok_healthy: '', stok_sultan: '',
    deskripsi: '', gambar_url: ''
  })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return window.location.href = '/login'
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        if (!snap.exists() || snap.data().role !== "admin") {
          await signOut(auth)
          return window.location.href = '/login'
        }
        setSession(user)
        loadProducts()
      } catch (err) {
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

  const loadProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    const linkLengkap = form.gambar_url ? BASE_URL_GAMBAR + form.gambar_url : null
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

  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <>
      <Head><title>Admin TotalGo</title></Head>
      <div style={styles.page}>
        <div style={styles.container}>
          
          <header style={styles.header}>
            <div>
              <h1 style={styles.h1}>Admin TotalGo</h1>
              <p style={styles.email}>{session?.email}</p>
            </div>
            <button onClick={handleLogout} style={styles.btnLogout}>Logout</button>
          </header>

          <div style={styles.card}>
            <h2 style={styles.h2}>{form.id ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={saveProduct}>
              <input placeholder="Nama Produk" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} style={styles.input} />
              
              <label style={styles.checkboxLabel}>
                <input type="checkbox" checked={form.punya_varian} onChange={e => setForm({...form, punya_varian: e.target.checked})} />
                Punya Varian Lite/Healthy/Sultan
              </label>

              {form.punya_varian ? (
                <div style={styles.grid2}>
                  <input placeholder="Harga Lite" type="number" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value})} style={styles.input} />
                  <input placeholder="Stok Lite" type="number" value={form.stok_lite} onChange={e => setForm({...form, stok_lite: e.target.value})} style={styles.input} />
                  <input placeholder="Harga Healthy" type="number" value={form.harga_healthy} onChange={e => setForm({...form, harga_healthy: e.target.value})} style={styles.input} />
                  <input placeholder="Stok Healthy" type="number" value={form.stok_healthy} onChange={e => setForm({...form, stok_healthy: e.target.value})} style={styles.input} />
                  <input placeholder="Harga Sultan" type="number" value={form.harga_sultan} onChange={e => setForm({...form, harga_sultan: e.target.value})} style={styles.input} />
                  <input placeholder="Stok Sultan" type="number" value={form.stok_sultan} onChange={e => setForm({...form, stok_sultan: e.target.value})} style={styles.input} />
                </div>
              ) : (
                <div style={styles.grid2}>
                  <input placeholder="Harga" type="number" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value})} style={styles.input} />
                  <input placeholder="Stok" type="number" value={form.stok} onChange={e => setForm({...form, stok: e.target.value})} style={styles.input} />
                </div>
              )}

              <textarea placeholder="Deskripsi" value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} style={{...styles.input, height: 80}} />
              <input placeholder="Nama file: menu-avocado.png" value={form.gambar_url} onChange={e => setForm({...form, gambar_url: e.target.value})} style={styles.input} />

              <div style={styles.btnGroup}>
                <button style={styles.btnPrimary}>{form.id ? 'Update' : 'Simpan'} Produk</button>
                {form.id && <button type="button" onClick={resetForm} style={styles.btnSecondary}>Batal</button>}
              </div>
            </form>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>List Produk</h2>
            {products.length === 0 ? <p style={styles.empty}>Belum ada produk</p> : products.map(p => (
              <div key={p.id} style={styles.productItem}>
                <div style={{display: 'flex', gap: 12, alignItems: 'center', flex: 1}}>
                  {p.gambar_url ? (
                    <img 
                      src={p.gambar_url} 
                      alt={p.nama}
                      style={{width: 56, height: 56, objectFit: 'cover', borderRadius: 12, background: '#222'}}
                      onError={(e) => {e.target.style.display = 'none'}}
                    />
                  ) : (
                    <div style={{width: 56, height: 56, borderRadius: 12, background: '#222'}} />
                  )}
                  <div>
                    <b style={styles.productName}>{p.nama}</b>
                    <p style={styles.productDesc}>
                      {p.punya_varian
                        ? `Lite: ${p.harga_lite} | Healthy: ${p.harga_healthy} | Sultan: ${p.harga_sultan}`
                        : `Harga: ${p.harga_lite} | Stok: ${p.stok}`
                      }
                    </p>
                  </div>
                </div>
                <div style={styles.btnGroup}>
                  <button onClick={() => editProduct(p)} style={styles.btnEdit}>Edit</button>
                  <button onClick={() => deleteProduct(p.id)} style={styles.btnDelete}>Hapus</button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}

const styles = {
  page: { background: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  container: { maxWidth: 480, margin: '0 auto', padding: 16 },
  loading: { padding: 20, background: '#000', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  h1: { fontSize: 24, fontWeight: 700, margin: 0 },
  h2: { fontSize: 18, fontWeight: 600, margin: '0 0 16px 0' },
  email: { fontSize: 12, color: '#888', margin: '4px 0 0 0' },
  card: { background: '#111', padding: 16, borderRadius: 16, marginBottom: 16, border: '1px solid #222' },
  input: { display: 'block', margin: '0 0 12px 0', padding: '12px', width: '100%', background: '#1C1C1C', border: '1px solid #333', color: '#fff', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px 0', fontSize: 14 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  btnGroup: { display: 'flex', gap: 8, marginTop: 8 },
  btnPrimary: { flex: 1, padding: '12px', background: '#fff', color: '#000', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  btnSecondary: { flex: 1, padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14 },
  btnLogout: { padding: '8px 16px', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: 8, fontSize: 14 },
  btnEdit: { padding: '6px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12 },
  btnDelete: { padding: '6px 12px', background: '#8B0000', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12 },
  productItem: { borderBottom: '1px solid #222', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  productName: { fontSize: 14 },
  productDesc: { margin: '4px 0 0 0', fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', color: '#666', padding: '20px 0' }
}
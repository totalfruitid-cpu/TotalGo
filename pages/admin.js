import { useState, useEffect } from 'react'
import Head from 'next/head'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from "firebase/firestore"

const BASE_URL_GAMBAR = "https://total-go.vercel.app/menu/"; // <-- CUMA NAMBAH INI DOANG DI LUAR

export default function Admin() {
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    id: '',
    nama: '',
    punya_varian: true,
    harga_lite: '',
    harga_healthy: '',
    harga_sultan: '',
    stok: '',
    deskripsi: '',
    gambar_url: ''
  })
  const [login, setLogin] = useState({ email: 'totalfruit.id@gmail.com', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSession(user)
      if (user) loadProducts()
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, login.email, login.password)
    } catch (error) {
      setError(error.message)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    setProducts([])
  }

  const loadProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)
    const data = querySnapshot.docs.map(doc => ({ id: doc.id,...doc.data() }))
    setProducts(data || [])
  }

  const handleVarianChange = (checked) => {
    if (!checked) {
      setForm({...form, punya_varian: false, harga_healthy: form.harga_lite, harga_sultan: form.harga_lite})
    } else {
      setForm({...form, punya_varian: true})
    }
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    if (!form.nama) return alert('Nama wajib diisi')
    if (form.punya_varian && (!form.harga_lite ||!form.harga_healthy ||!form.harga_sultan)) {
      return alert('Semua harga varian wajib diisi')
    }
    if (!form.punya_varian &&!form.harga_lite) return alert('Harga wajib diisi')

    // === EDIT: GABUNGIN BASE URL PAS SAVE ===
    const linkLengkap = form.gambar_url ? BASE_URL_GAMBAR + form.gambar_url : null;
    // === SELESAI EDIT ===

    const payload = {
      nama: form.nama,
      punya_varian: form.punya_varian,
      harga_lite: parseInt(form.harga_lite) || 0,
      harga_healthy: parseInt(form.punya_varian? form.harga_healthy : form.harga_lite) || 0,
      harga_sultan: parseInt(form.punya_varian? form.harga_sultan : form.harga_lite) || 0,
      stok: parseInt(form.stok) || 0,
      deskripsi: form.deskripsi,
      gambar_url: linkLengkap // <-- EDIT: PAKE linkLengkap
    }

    try {
      if (form.id) {
        await updateDoc(doc(db, 'products', form.id), payload)
      } else {
        payload.created_at = serverTimestamp()
        await addDoc(collection(db, 'products'), payload)
      }
    } catch (err) {
      console.error(err)
      alert('Gagal simpan: ' + err.message)
    }
    setForm({
      id: '',
      nama: '',
      punya_varian: true,
      harga_lite: '',
      harga_healthy: '',
      harga_sultan: '',
      stok: '',
      deskripsi: '',
      gambar_url: ''
    })
    loadProducts()
  }

  const editProduct = (p) => {
    setForm({
      id: p.id,
      nama: p.nama || '',
      punya_varian: p.punya_varian !== false,
      harga_lite: p.harga_lite || '',
      harga_healthy: p.harga_healthy || '',
      harga_sultan: p.harga_sultan || '',
      stok: p.stok || '',
      deskripsi: p.deskripsi || '',
      gambar_url: p.gambar_url ? p.gambar_url.replace(BASE_URL_GAMBAR, '') : ''
    })
  }

  const deleteProduct = async (id) => {
    if (!confirm('Yakin hapus produk ini?')) return
    try {
      await deleteDoc(doc(db, 'products', id))
      loadProducts()
    } catch (err) {
      alert('Gagal hapus: ' + err.message)
    }
  }

  if (loading) return <p>Loading...</p>

  if (!session) {
    return (
      <>
        <Head><title>Login Admin</title></Head>
        <div style={{padding: 20, maxWidth: 400, margin: '40px auto'}}>
          <h1>Login Admin TotalGo</h1>
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              value={login.email} 
              onChange={e => setLogin({...login, email: e.target.value})}
              style={{width: '100%', padding: 8, marginBottom: 10}}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={login.password} 
              onChange={e => setLogin({...login, password: e.target.value})}
              style={{width: '100%', padding: 8, marginBottom: 10}}
            />
            <button type="submit" style={{width: '100%', padding: 10}}>Login</button>
            {error && <p style={{color: 'red'}}>{error}</p>}
          </form>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Admin TotalGo</title></Head>
      <div style={{padding: 20}}>
        <h1>Admin TotalGo</h1>
        <button onClick={handleLogout}>Logout</button>
        
        <h2>{form.id ? 'Edit Produk' : 'Tambah Produk'}</h2>
        <form onSubmit={saveProduct} style={{marginBottom: 40, maxWidth: 500}}>
          <input 
            placeholder="Nama Produk" 
            value={form.nama} 
            onChange={e => setForm({...form, nama: e.target.value})}
            style={{width: '100%', padding: 8, marginBottom: 10}}
          />
          
          <label>
            <input 
              type="checkbox" 
              checked={form.punya_varian}
              onChange={e => handleVarianChange(e.target.checked)}
            /> Punya Varian Harga
          </label>
          <br/><br/>

          <input 
            placeholder="Harga Lite / Harga Utama" 
            type="number"
            value={form.harga_lite} 
            onChange={e => setForm({...form, harga_lite: e.target.value})}
            style={{width: '100%', padding: 8, marginBottom: 10}}
          />

          {form.punya_varian && (
            <>
              <input 
                placeholder="Harga Healthy" 
                type="number"
                value={form.harga_healthy} 
                onChange={e => setForm({...form, harga_healthy: e.target.value})}
                style={{width: '100%', padding: 8, marginBottom: 10}}
              />
              <input 
                placeholder="Harga Sultan" 
                type="number"
                value={form.harga_sultan} 
                onChange={e => setForm({...form, harga_sultan: e.target.value})}
                style={{width: '100%', padding: 8, marginBottom: 10}}
              />
            </>
          )}

          <input 
            placeholder="Stok" 
            type="number"
            value={form.stok} 
            onChange={e => setForm({...form, stok: e.target.value})}
            style={{width: '100%', padding: 8, marginBottom: 10}}
          />
          
          <textarea 
            placeholder="Deskripsi" 
            value={form.deskripsi} 
            onChange={e => setForm({...form, deskripsi: e.target.value})}
            style={{width: '100%', padding: 8, marginBottom: 10, height: 80}}
          />

          <input 
            placeholder="Nama file gambar: contoh menu-alpukat.png" 
            value={form.gambar_url} 
            onChange={e => setForm({...form, gambar_url: e.target.value})}
            style={{width: '100%', padding: 8, marginBottom: 10}}
          />
          <small>File harus ada di folder /public/menu/</small>
          <br/><br/>

          <button type="submit" style={{padding: '10px 20px', marginRight: 10}}>
            {form.id ? 'Update' : 'Simpan'} Produk
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm({
              id: '', nama: '', punya_varian: true, harga_lite: '', 
              harga_healthy: '', harga_sultan: '', stok: '', deskripsi: '', gambar_url: ''
            })}>
              Batal Edit
            </button>
          )}
        </form>

        <h2>List Produk</h2>
        {products.map(p => (
          <div key={p.id} style={{border: '1px solid #ccc', padding: 10, marginBottom: 10}}>
            <b>{p.nama}</b> - Stok: {p.stok}
            <br/>
            {p.punya_varian ? 
              `Lite: ${p.harga_lite} | Healthy: ${p.harga_healthy} | Sultan: ${p.harga_sultan}` : 
              `Harga: ${p.harga_lite}`
            }
            <br/>
            {p.gambar_url && <img src={p.gambar_url} alt={p.nama} style={{width: 100, height: 100, objectFit: 'cover'}}/>}
            <br/>
            <button onClick={() => editProduct(p)}>Edit</button>
            <button onClick={() => deleteProduct(p.id)} style={{marginLeft: 10}}>Hapus</button>
          </div>
        ))}
      </div>
    </>
  )
}
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from "firebase/firestore"

const BASE_URL_GAMBAR = "https://totalgo.vercel.app/menu/";

export default function Admin() {
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    id: '', nama: '', punya_varian: true, harga_lite: '', harga_healthy: '', harga_sultan: '', stok: '', deskripsi: '', gambar_url: ''
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

    const linkLengkap = form.gambar_url ? BASE_URL_GAMBAR + form.gambar_url : null;

    const payload = {
      nama: form.nama,
      punya_varian: form.punya_varian,
      harga_lite: parseInt(form.harga_lite) || 0,
      harga_healthy: parseInt(form.punya_varian? form.harga_healthy : form.harga_lite) || 0,
      harga_sultan: parseInt(form.punya_varian? form.harga_sultan : form.harga_lite) || 0,
      stok: parseInt(form.stok) || 0,
      deskripsi: form.deskripsi,
      gambar_url: linkLengkap
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
    setForm({id: '', nama: '', punya_varian: true, harga_lite: '', harga_healthy: '', harga_sultan: '', stok: '', deskripsi: '', gambar_url: ''})
    loadProducts()
  }

  const editProduct = (p) => {
    setForm({
      id: p.id, nama: p.nama || '', punya_varian: p.punya_varian !== false,
      harga_lite: p.harga_lite || '', harga_healthy: p.harga_healthy || '', harga_sultan: p.harga_sultan || '',
      stok: p.stok || '', deskripsi: p.deskripsi || '',
      gambar_url: p.gambar_url ? p.gambar_url.replace(BASE_URL_GAMBAR, '') : ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>

  return (
    <>
      <Head><title>Admin TotalGo</title></Head>
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 24px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        h1 { font-size: 28px; color: #1a1a1a; }
        h2 { font-size: 20px; color: #1a1a1a; margin-bottom: 16px; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; } }
        .form-full { grid-column: 1 / -1; }
        label { display: block; font-size: 14px; font-weight: 500; color: #333; margin-bottom: 6px; }
        input, textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
        input:focus, textarea:focus { outline: none; border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
        textarea { resize: vertical; min-height: 80px; }
        .checkbox-wrap { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .btn { padding: 10px 20px; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .btn-primary { background: #16a34a; color: white; }
        .btn-primary:hover { background: #15803d; }
        .btn-secondary { background: #e5e7eb; color: #1f2937; }
        .btn-secondary:hover { background: #d1d5db; }
        .btn-blue { background: #3b82f6; color: white; }
        .btn-blue:hover { background: #2563eb; }
        .btn-red { background: #ef4444; color: white; }
        .btn-red:hover { background: #dc2626; }
        .btn-group { display: flex; gap: 12px; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .product-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .product-img { width: 100%; height: 180px; object-fit: cover; background: #f3f4f6; }
        .product-body { padding: 16px; }
        .product-title { font-weight: 600; font-size: 18px; margin-bottom: 4px; }
        .product-meta { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
        .product-price { font-size: 14px; color: #374151; margin-bottom: 12px; }
        .product-price p { margin: 2px 0; }
        .login-box { max-width: 400px; margin: 60px auto; }
        .error { color: #dc2626; font-size: 14px; text-align: center; margin-top: 12px; }
        small { font-size: 12px; color: #6b7280; }
      `}</style>

      {!session ? (
        <div className="container">
          <div className="card login-box">
            <h1 style={{textAlign:'center', marginBottom:24}}>Login Admin TotalGo</h1>
            <form onSubmit={handleLogin}>
              <div style={{marginBottom:16}}>
                <label>Email</label>
                <input type="email" value={login.email} onChange={e => setLogin({...login, email: e.target.value})} />
              </div>
              <div style={{marginBottom:16}}>
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={login.password} onChange={e => setLogin({...login, password: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Login</button>
              {error && <p className="error">{error}</p>}
            </form>
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="header">
            <h1>Admin TotalGo</h1>
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </div>
          
          <div className="card">
            <h2>{form.id ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={saveProduct} className="form-grid">
              <div className="form-full">
                <label>Nama Produk</label>
                <input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} />
              </div>
              
              <div className="form-full">
                <label className="checkbox-wrap">
                  <input type="checkbox" checked={form.punya_varian} onChange={e => handleVarianChange(e.target.checked)} />
                  <span>Punya Varian Harga</span>
                </label>
              </div>

              <div>
                <label>{form.punya_varian ? 'Harga Lite' : 'Harga'}</label>
                <input type="number" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value})} />
              </div>

              {form.punya_varian && (
                <>
                  <div>
                    <label>Harga Healthy</label>
                    <input type="number" value={form.harga_healthy} onChange={e => setForm({...form, harga_healthy: e.target.value})} />
                  </div>
                  <div>
                    <label>Harga Sultan</label>
                    <input type="number" value={form.harga_sultan} onChange={e => setForm({...form, harga_sultan: e.target.value})} />
                  </div>
                </>
              )}

              <div>
                <label>Stok</label>
                <input type="number" value={form.stok} onChange={e => setForm({...form, stok: e.target.value})} />
              </div>
              
              <div className="form-full">
                <label>Deskripsi</label>
                <textarea value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} />
              </div>

              <div className="form-full">
                <label>Nama File Gambar</label>
                <input placeholder="menu-avocado.png" value={form.gambar_url} onChange={e => setForm({...form, gambar_url: e.target.value})} />
                <small>File harus ada di /public/menu/. Contoh: menu-avocado.png</small>
              </div>

              <div className="form-full btn-group">
                <button type="submit" className="btn btn-primary">
                  {form.id ? 'Update Produk' : 'Simpan Produk'}
                </button>
                {form.id && (
                  <button type="button" onClick={() => setForm({id: '', nama: '', punya_varian: true, harga_lite: '', harga_healthy: '', harga_sultan: '', stok: '', deskripsi: '', gambar_url: ''})} className="btn btn-secondary">
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <h2>List Produk</h2>
          <div className="products-grid">
            {products.map(p => (
              <div key={p.id} className="product-card">
                {p.gambar_url ? (
                  <img src={p.gambar_url} alt={p.nama} className="product-img" onError={(e) => e.target.style.display='none'}/>
                ) : (
                  <div className="product-img" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af'}}>No Image</div>
                )}
                <div className="product-body">
                  <div className="product-title">{p.nama}</div>
                  <div className="product-meta">Stok: {p.stok}</div>
                  <div className="product-price">
                    {p.punya_varian ? 
                      <>
                        <p>Lite: Rp {p.harga_lite?.toLocaleString('id-ID')}</p>
                        <p>Healthy: Rp {p.harga_healthy?.toLocaleString('id-ID')}</p>
                        <p>Sultan: Rp {p.harga_sultan?.toLocaleString('id-ID')}</p>
                      </> : 
                      <p>Harga: Rp {p.harga_lite?.toLocaleString('id-ID')}</p>
                    }
                  </div>
                  <div className="btn-group">
                    <button onClick={() => editProduct(p)} className="btn btn-blue" style={{flex:1}}>Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="btn btn-red" style={{flex:1}}>Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
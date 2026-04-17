import { useState, useEffect } from 'react'
import Head from 'next/head'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from "firebase/firestore"

// UDAH GUE BENERIN: pake path relatif, bukan URL lengkap
const BASE_URL_GAMBAR = "/menu/";

export default function Admin() {
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    id: '', nama: '', punya_varian: true, harga_lite: '', harga_healthy: '', harga_sultan: '', 
    stok: '', stok_lite: '', stok_healthy: '', stok_sultan: '', 
    deskripsi: '', gambar_url: ''
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

  const resetForm = () => {
    setForm({id: '', nama: '', punya_varian: true, harga_lite: '', harga_healthy: '', harga_sultan: '', stok: '', stok_lite: '', stok_healthy: '', stok_sultan: '', deskripsi: '', gambar_url: ''})
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    if (!form.nama) return alert('Nama wajib diisi')
    if (form.punya_varian && (!form.harga_lite ||!form.harga_healthy ||!form.harga_sultan)) {
      return alert('Semua harga varian wajib diisi')
    }
    if (!form.punya_varian &&!form.harga_lite) return alert('Harga wajib diisi')

    // INI KUNCINYA: Sekarang hasilnya /menu/menu-strawberry.png
    const linkLengkap = form.gambar_url ? BASE_URL_GAMBAR + form.gambar_url : null;

    const payload = {
      nama: form.nama,
      punya_varian: form.punya_varian,
      harga_lite: parseInt(form.harga_lite) || 0,
      harga_healthy: parseInt(form.punya_varian? form.harga_healthy : form.harga_lite) || 0,
      harga_sultan: parseInt(form.punya_varian? form.harga_sultan : form.harga_lite) || 0,
      deskripsi: form.deskripsi,
      gambar_url: linkLengkap
    }

    // BAGIAN STOK GUE BENERIN DI SINI
    if (form.punya_varian) {
      payload.stok_lite = parseInt(form.stok_lite) || 0
      payload.stok_healthy = parseInt(form.stok_healthy) || 0
      payload.stok_sultan = parseInt(form.stok_sultan) || 0
      delete payload.stok // hapus field stok lama kalo ada varian
    } else {
      payload.stok = parseInt(form.stok) || 0
      // hapus field stok varian kalo gak ada varian
      payload.stok_lite = null
      payload.stok_healthy = null
      payload.stok_sultan = null
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
    resetForm()
    loadProducts()
  }

  const editProduct = (p) => {
    const namaFile = p.gambar_url ? p.gambar_url.replace(BASE_URL_GAMBAR, '') : ''
    setForm({
      id: p.id, nama: p.nama || '', punya_varian: p.punya_varian !== false,
      harga_lite: p.harga_lite || '', harga_healthy: p.harga_healthy || '', harga_sultan: p.harga_sultan || '',
      stok: p.stok || '', 
      stok_lite: p.stok_lite || '', 
      stok_healthy: p.stok_healthy || '', 
      stok_sultan: p.stok_sultan || '',
      deskripsi: p.deskripsi || '',
      gambar_url: namaFile
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

  if (loading) return <p style={{textAlign:'center', marginTop:50}}>Loading...</p>

  return (
    <>
      <Head><title>Dashboard Produk</title></Head>
      <style jsx>{`
        .wrap { max-width: 600px; margin: 0 auto; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; min-height: 100vh; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        h1 { font-size: 28px; margin: 0; font-weight: 600; }
        .card { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h2 { font-size: 18px; margin: 0 0 16px 0; font-weight: 600; }
        .field { margin-bottom: 12px; }
        .field input, .field textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 15px; background: #fff; }
        .field textarea { min-height: 80px; resize: vertical; }
        .field input::placeholder, .field textarea::placeholder { color: #999; }
        .checkbox-row { display: flex; align-items: center; gap: 10px; margin: 12px 0; }
        .checkbox-row input { width: 20px; height: 20px; }
        .checkbox-row label { font-size: 15px; color: #333; }
        .harga-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .harga-row input { flex: 1; min-width: 0; padding: 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 15px; background: #fff; }
        .harga-row input::placeholder { color: #999; }
        .btn-row { display: flex; gap: 10px; margin-top: 8px; }
        .btn { flex: 1; padding: 12px; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .btn-simpan { background: #22c55e; color: white; }
        .btn-reset { background: #6b7280; color: white; flex: 0.5; }
        .btn-logout { background: #dc2626; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; border: none; cursor: pointer; }
        .product-item { display: flex; gap: 12px; padding: 12px; background: #fff; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); align-items: flex-start; }
        .product-img { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #f3f4f6; flex-shrink: 0; }
        .product-info { flex: 1; }
        .product-name { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
        .price-tag { background: #f3f4f6; padding: 4px 10px; border-radius: 6px; font-size: 14px; display: inline-block; }
        .product-actions { display: flex; flex-direction: column; gap: 6px; }
        .btn-edit { background: #3b82f6; color: white; padding: 6px 14px; border-radius: 8px; font-size: 14px; border: none; cursor: pointer; font-weight: 500; }
        .btn-hapus { background: #ef4444; color: white; padding: 6px 14px; border-radius: 8px; font-size: 14px; border: none; cursor: pointer; font-weight: 500; }
        .error { color: #dc2626; text-align: center; margin-top: 12px; font-size: 14px; }
        .hint { font-size: 12px; color: #666; margin-top: 4px; }
      `}</style>

      <div className="wrap">
        {!session ? (
          <div className="card">
            <h2>Login Admin TotalGo</h2>
            <form onSubmit={handleLogin}>
              <div className="field">
                <input type="email" placeholder="Email" value={login.email} onChange={e => setLogin({...login, email: e.target.value})} />
              </div>
              <div className="field">
                <input type="password" placeholder="Password" value={login.password} onChange={e => setLogin({...login, password: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-simpan" style={{width:'100%'}}>Login</button>
              {error && <p className="error">{error}</p>}
            </form>
          </div>
        ) : (
          <>
            <div className="header">
              <h1>Dashboard Produk</h1>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
            
            <div className="card">
              <h2>Tambah / Edit Produk</h2>
              <form onSubmit={saveProduct}>
                <div className="field">
                  <input placeholder="Nama Produk" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} />
                </div>
                
                <div className="checkbox-row">
                  <input type="checkbox" checked={form.punya_varian} onChange={e => handleVarianChange(e.target.checked)} />
                  <label>Produk punya varian Lite/Healthy/Sultan</label>
                </div>

                {form.punya_varian ? (
                  <>
                    <div className="harga-row">
                      <input type="number" placeholder="Harga Lite" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value})} />
                      <input type="number" placeholder="Harga Healthy" value={form.harga_healthy} onChange={e => setForm({...form, harga_healthy: e.target.value})} />
                      <input type="number" placeholder="Harga Sultan" value={form.harga_sultan} onChange={e => setForm({...form, harga_sultan: e.target.value})} />
                    </div>
                    <div className="harga-row">
                      <input type="number" placeholder="Stok Lite" value={form.stok_lite} onChange={e => setForm({...form, stok_lite: e.target.value})} />
                      <input type="number" placeholder="Stok Healthy" value={form.stok_healthy} onChange={e => setForm({...form, stok_healthy: e.target.value})} />
                      <input type="number" placeholder="Stok Sultan" value={form.stok_sultan} onChange={e => setForm({...form, stok_sultan: e.target.value})} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="field">
                      <input type="number" placeholder="Harga" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value})} />
                    </div>
                    <div className="field">
                      <input type="number" placeholder="Stok" value={form.stok} onChange={e => setForm({...form, stok: e.target.value})} />
                    </div>
                  </>
                )}
                
                <div className="field">
                  <textarea placeholder="Deskripsi produk: bahan, manfaat, keunikan" value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} />
                </div>

                <div className="field">
                  <input placeholder="Nama file: menu-banana.png" value={form.gambar_url} onChange={e => setForm({...form, gambar_url: e.target.value})} />
                  <div className="hint">File di Github harus ada di /public/menu/. Contoh: menu-banana.png</div>
                </div>

                <div className="btn-row">
                  <button type="submit" className="btn btn-simpan">Simpan</button>
                  <button type="button" onClick={resetForm} className="btn btn-reset">Reset</button>
                </div>
              </form>
            </div>

            <div className="card">
              <h2>Daftar Produk</h2>
              {products.map(p => (
                <div key={p.id} className="product-item">
                  {p.gambar_url ? (
                    <img src={p.gambar_url} alt={p.nama} className="product-img" onError={(e) => e.target.style.display='none'}/>
                  ) : (
                    <div className="product-img"></div>
                  )}
                  <div className="product-info">
                    <div className="product-name">{p.nama}</div>
                    {!p.punya_varian && <div className="price-tag">Rp{p.harga_lite?.toLocaleString('id-ID')}</div>}
                    {p.punya_varian && <div className="price-tag">Lite: {p.stok_lite||0} | Healthy: {p.stok_healthy||0} | Sultan: {p.stok_sultan||0}</div>}
                  </div>
                  <div className="product-actions">
                    <button onClick={() => editProduct(p)} className="btn-edit">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="btn-hapus">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
import { useState, useEffect } from 'react'
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import Head from 'next/head'

const supabase = createClient(
  'https://ynnnwppyarvxtpuonnha.supabase.co',
  'sb_publishable_d_kXZ7IGuFdqQQHKv0zUTg_vCp9OnwN'
)

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
    file: null
  })

  const [preview, setPreview] = useState('')
  const [login, setLogin] = useState({ email: 'totalfruit.id@gmail.com', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProducts()
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProducts()
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword(login)
    if (error) setError(error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProducts([])
  }

  const loadProducts = async () => {
    const { data } = await supabase.from('produk').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    setForm({...form, file })
    if (file) setPreview(URL.createObjectURL(file))
  }

  const handleVarianChange = (checked) => {
    if (!checked) {
      // Kalo gak punya varian, samain semua harga ke harga_lite
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

    let gambar_url = null
    if (form.file) {
      const fileName = `produk/${Date.now()}_${form.file.name}`
      const { error } = await supabase.storage.from('gambar_produk').upload(fileName, form.file)
      if (error) return alert('Gagal upload: ' + error.message)
      const { data: { publicUrl } } = supabase.storage.from('gambar_produk').getPublicUrl(fileName)
      gambar_url = publicUrl
    }

    const payload = {
      nama: form.nama,
      punya_varian: form.punya_varian,
      harga_lite: parseInt(form.harga_lite),
      harga_healthy: parseInt(form.punya_varian? form.harga_healthy : form.harga_lite),
      harga_sultan: parseInt(form.punya_varian? form.harga_sultan : form.harga_lite),
      stok: parseInt(form.stok) || 0,
      deskripsi: form.deskripsi
    }
    if (gambar_url) payload.gambar_url = gambar_url
    if (form.id) await supabase.from('produk').update(payload).eq('id', form.id)
    else await supabase.from('produk').insert([payload])
    resetForm()
    loadProducts()
  }

  const resetForm = () => {
    setForm({ id: '', nama: '', punya_varian: true, harga_lite: '', harga_healthy: '', harga_sultan: '', stok: '', deskripsi: '', file: null })
    setPreview('')
  }

  const editProduct = (p) => {
    setForm({...p, file: null })
    setPreview(p.gambar_url)
    window.scrollTo(0, 0)
  }

  const deleteProduct = async (id) => {
    if (!confirm('Yakin hapus?')) return
    await supabase.from('produk').delete().eq('id', id)
    loadProducts()
  }

  if (loading) return <div style={{padding: 32}}>Loading...</div>

  if (!session) return (
    <>
      <Head><title>Login Admin TotalGo</title></Head>
      <div className="login-wrap">
        <h1>Login Admin TotalGo</h1>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={login.email} onChange={e => setLogin({...login, email: e.target.value})} />
          <input type="password" placeholder="Password" value={login.password} onChange={e => setLogin({...login, password: e.target.value})} />
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
      <style jsx>{`
    .login-wrap { max-width: 400px; margin: 80px auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        h1 { margin-bottom: 16px; text-align: center; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 12px; }
        button { width: 100%; padding: 12px; background: #16a34a; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .error { color: #dc2626; font-size: 14px; margin-top: 8px; text-align: center; }
      `}</style>
    </>
  )

  return (
    <>
      <Head><title>Admin TotalGo</title></Head>
      <div className="admin-wrap">
        <div className="topbar">
          <h1>Dashboard Produk</h1>
          <button onClick={handleLogout} className="logout">Logout</button>
        </div>
        <form onSubmit={saveProduct} className="card">
          <h2>Tambah / Edit Produk</h2>
          <input placeholder="Nama Produk" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} required />

          <label className="check-varian">
            <input
              type="checkbox"
              checked={form.punya_varian}
              onChange={e => handleVarianChange(e.target.checked)}
            />
            Produk punya varian Lite/Healthy/Sultan
          </label>

          {form.punya_varian? (
            <div className="harga-row">
              <input type="number" placeholder="Harga Lite" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value})} required />
              <input type="number" placeholder="Harga Healthy" value={form.harga_healthy} onChange={e => setForm({...form, harga_healthy: e.target.value})} required />
              <input type="number" placeholder="Harga Sultan" value={form.harga_sultan} onChange={e => setForm({...form, harga_sultan: e.target.value})} required />
            </div>
          ) : (
            <input type="number" placeholder="Harga" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value})} required />
          )}

          <input type="number" placeholder="Stok" value={form.stok} onChange={e => setForm({...form, stok: e.target.value})} />
          <textarea placeholder="Deskripsi produk: bahan, manfaat, keunikan" value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} />
          <input type="file" accept="image/*" onChange={handleFile} />
          {preview && <img src={preview} className="preview" alt="preview" />}
          <div className="btn-group">
            <button type="submit" className="save">Simpan</button>
            <button type="button" onClick={resetForm} className="reset">Reset</button>
          </div>
        </form>
        <div className="card">
          <h2>Daftar Produk</h2>
          {products.length === 0? <p>Belum ada produk</p> : products.map(p => (
            <div key={p.id} className="item">
              <img src={p.gambar_url || 'https://via.placeholder.com/80'} alt={p.nama} />
              <div className="info">
                <b>{p.nama}</b> {p.punya_varian && <span className="badge">Varian</span>}<br />
                {p.punya_varian? (
                  <div className="harga-list">
                    <span>Lite: Rp{Number(p.harga_lite).toLocaleString('id-ID')}</span>
                    <span>Healthy: Rp{Number(p.harga_healthy).toLocaleString('id-ID')}</span>
                    <span>Sultan: Rp{Number(p.harga_sultan).toLocaleString('id-ID')}</span>
                  </div>
                ) : (
                  <div className="harga-list">
                    <span>Rp{Number(p.harga_lite).toLocaleString('id-ID')}</span>
                  </div>
                )}
                Stok: {p.stok || 0}<br />
                <span className="desc">{p.deskripsi}</span>
              </div>
              <div className="actions">
                <button onClick={() => editProduct(p)} className="edit">Edit</button>
                <button onClick={() => deleteProduct(p.id)} className="delete">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      <style jsx global>{`body { background: #f3f4f6; font-family: sans-serif; }`}</style>
      <style jsx>{`
    .admin-wrap { max-width: 800px; margin: 0 auto; padding: 16px; }
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .topbar h1 { font-size: 28px; }
    .logout { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
    .card { background: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .card h2 { margin-bottom: 16px; }
        input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 8px; }
        textarea { min-height: 80px; }
    .check-varian { display: flex; gap: 8px; margin: 8px 0; align-items: center; font-size: 14px; }
    .check-varian input { width: auto; margin: 0; }
    .harga-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .harga-row input { margin-bottom: 0; }
    .preview { width: 128px; height: 128px; object-fit: cover; border-radius: 8px; margin: 8px 0; }
    .btn-group { display: flex; gap: 8px; }
    .save { flex: 1; background: #16a34a; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .reset { background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
    .item { display: flex; gap: 16px; border: 1px solid #eee; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
    .item img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }
    .info { flex: 1; }
    .badge { background: #fef3c7; color: #92400e; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-left: 6px; }
    .harga-list { display: flex; gap: 8px; flex-wrap: wrap; margin: 4px 0; }
    .harga-list span { font-size: 12px; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; }
    .desc { font-size: 14px; color: #6b7280; }
    .actions { display: flex; flex-direction: column; gap: 4px; }
    .edit { background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
    .delete { background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
      `}</style>
      </div>
    </>
  )
}
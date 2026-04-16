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
  const [form, setForm] = useState({ id: '', nama: '', harga: '', stok: '', deskripsi: '', file: null })
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

  const saveProduct = async (e) => {
    e.preventDefault()
    if (!form.nama ||!form.harga) return alert('Nama & harga wajib diisi')
    let gambar_url = null
    if (form.file) {
      const fileName = `produk/${Date.now()}_${form.file.name}`
      const { error } = await supabase.storage.from('gambar_produk').upload(fileName, form.file)
      if (error) return alert('Gagal upload: ' + error.message)
      const { data: { publicUrl } } = supabase.storage.from('gambar_produk').getPublicUrl(fileName)
      gambar_url = publicUrl
    }
    const payload = { nama: form.nama, harga: form.harga, stok: form.stok, deskripsi: form.deskripsi }
    if (gambar_url) payload.gambar_url = gambar_url
    if (form.id) await supabase.from('produk').update(payload).eq('id', form.id)
    else await supabase.from('produk').insert([payload])
    resetForm()
    loadProducts()
  }

  const resetForm = () => {
    setForm({ id: '', nama: '', harga: '', stok: '', deskripsi: '', file: null })
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
          <input placeholder="Nama Produk" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} />
          <input type="number" placeholder="Harga" value={form.harga} onChange={e => setForm({...form, harga: e.target.value})} />
          <input type="number" placeholder="Stok" value={form.stok} onChange={e => setForm({...form, stok: e.target.value})} />
          <textarea placeholder="Deskripsi" value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} />
          <input type="file" accept="image/*" onChange={handleFile} />
          {preview && <img src={preview} className="preview" alt="preview" />}
          <div className="btn-group">
            <button type="submit" className="save">Simpan</button>
            <button type="button" onClick={resetForm} className="reset">Reset</button>
          </div>
        </form>
        <div className="card">
          <h2>Daftar Produk</h2>
          {products.map(p => (
            <div key={p.id} className="item">
              <img src={p.gambar_url || 'https://via.placeholder.com/80'} alt={p.nama} />
              <div className="info">
                <b>{p.nama}</b><br />
                Rp {Number(p.harga).toLocaleString()} | Stok: {p.stok || 0}<br />
                <span>{p.deskripsi}</span>
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
       .preview { width: 128px; height: 128px; object-fit: cover; border-radius: 8px; margin: 8px 0; }
       .btn-group { display: flex; gap: 8px; }
       .save { flex: 1; background: #16a34a; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; }
       .reset { background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
       .item { display: flex; gap: 16px; border: 1px solid #eee; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
       .item img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }
       .info { flex: 1; }
       .info span { font-size: 14px; color: #6b7280; }
       .actions { display: flex; flex-direction: column; gap: 4px; }
       .edit { background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
       .delete { background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
      `}</style>
    </>
  )
}
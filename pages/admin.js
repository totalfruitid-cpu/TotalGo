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
    setForm({
      id: '', nama: '', punya_varian: true, harga_lite: '', 
      harga_healthy: '', harga_sultan: '', stok: '', deskripsi: '', gambar_url: ''
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

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"
  const btnPrimary = "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
  const btnSecondary = "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>

  if (!session) {
    return (
      <>
        <Head><title>Login Admin</title></Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Login Admin TotalGo</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input 
                  type="email" 
                  value={login.email} 
                  onChange={e => setLogin({...login, email: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={login.password} 
                  onChange={e => setLogin({...login, password: e.target.value})}
                  className={inputClass}
                />
              </div>
              <button type="submit" className={`w-full ${btnPrimary}`}>Login</button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </form>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Admin TotalGo</title></Head>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin TotalGo</h1>
            <button onClick={handleLogout} className={btnSecondary}>Logout</button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">{form.id ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Nama Produk</label>
                <input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className={inputClass}/>
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.punya_varian} onChange={e => handleVarianChange(e.target.checked)} className="w-4 h-4 text-green-600 rounded"/>
                  <span className="text-sm font-medium text-gray-700">Punya Varian Harga</span>
                </label>
              </div>

              <div>
                <label className={labelClass}>{form.punya_varian ? 'Harga Lite' : 'Harga'}</label>
                <input type="number" value={form.harga_lite} onChange={e => setForm({...form, harga_lite: e.target.value})} className={inputClass}/>
              </div>

              {form.punya_varian && (
                <>
                  <div>
                    <label className={labelClass}>Harga Healthy</label>
                    <input type="number" value={form.harga_healthy} onChange={e => setForm({...form, harga_healthy: e.target.value})} className={inputClass}/>
                  </div>
                  <div>
                    <label className={labelClass}>Harga Sultan</label>
                    <input type="number" value={form.harga_sultan} onChange={e => setForm({...form, harga_sultan: e.target.value})} className={inputClass}/>
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>Stok</label>
                <input type="number" value={form.stok} onChange={e => setForm({...form, stok: e.target.value})} className={inputClass}/>
              </div>
              
              <div className="md:col-span-2">
                <label className={labelClass}>Deskripsi</label>
                <textarea value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} className={`${inputClass} h-24`}/>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Nama File Gambar</label>
                <input 
                  placeholder="menu-avocado.png" 
                  value={form.gambar_url} 
                  onChange={e => setForm({...form, gambar_url: e.target.value})}
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">File harus ada di /public/menu/. Contoh: menu-avocado.png</p>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className={btnPrimary}>
                  {form.id ? 'Update Produk' : 'Simpan Produk'}
                </button>
                {form.id && (
                  <button type="button" onClick={() => setForm({id: '', nama: '', punya_varian: true, harga_lite: '', harga_healthy: '', harga_sultan: '', stok: '', deskripsi: '', gambar_url: ''})} className={btnSecondary}>
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <h2 className="text-xl font-semibold mb-4 text-gray-800">List Produk</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {p.gambar_url && <img src={p.gambar_url} alt={p.nama} className="w-full h-40 object-cover"/>}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{p.nama}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">Stok: {p.stok}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {p.punya_varian ? 
                      <>
                        <p>Lite: Rp {p.harga_lite?.toLocaleString('id-ID')}</p>
                        <p>Healthy: Rp {p.harga_healthy?.toLocaleString('id-ID')}</p>
                        <p>Sultan: Rp {p.harga_sultan?.toLocaleString('id-ID')}</p>
                      </> : 
                      <p>Harga: Rp {p.harga_lite?.toLocaleString('id-ID')}</p>
                    }
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editProduct(p)} className="flex-1 text-sm px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="flex-1 text-sm px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600">Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
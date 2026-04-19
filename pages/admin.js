import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
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
  where
} from "firebase/firestore"

const BASE_URL_GAMBAR = "/menu/";

export default function Admin() {
  const router = useRouter()

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

  const [login, setLogin] = useState({
    email: 'totalfruit.id@gmail.com',
    password: ''
  })

  // =========================
  // 🔐 SECURITY CHECK ADMIN
  // =========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const q = query(
          collection(db, "users"),
          where("email", "==", user.email)
        )

        const snap = await getDocs(q)

        if (snap.empty) {
          await signOut(auth)
          router.push('/login')
          return
        }

        const data = snap.docs[0].data()

        if (data.role !== "admin") {
          await signOut(auth)
          router.push('/login')
          return
        }

        setSession(user)
        loadProducts()

      } catch (err) {
        console.error(err)
        router.push('/login')
      }

      setLoading(false)
    })

    return () => unsub()
  }, [])

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, login.email, login.password)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    setSession(null)
    setProducts([])
    router.push('/login')
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
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
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

  if (loading) return <p>Loading...</p>

  return (
    <>
      <Head>
        <title>TotalGo Admin</title>
      </Head>

      <div className="wrap">

        {!session ? (
          <div className="card">
            <h2>Login Admin</h2>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={login.email}
                onChange={e => setLogin({ ...login, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                onChange={e => setLogin({ ...login, password: e.target.value })}
              />
              <button>Login</button>
              {error && <p>{error}</p>}
            </form>
          </div>
        ) : (
          <>
            <div className="header">
              <h1>Admin Dashboard</h1>
              <button onClick={handleLogout}>Logout</button>
            </div>

            <div className="card">
              <h2>Produk</h2>

              <form onSubmit={saveProduct}>
                <input
                  placeholder="Nama"
                  value={form.nama}
                  onChange={e => setForm({ ...form, nama: e.target.value })}
                />

                <textarea
                  placeholder="Deskripsi"
                  value={form.deskripsi}
                  onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                />

                <input
                  placeholder="Gambar"
                  value={form.gambar_url}
                  onChange={e => setForm({ ...form, gambar_url: e.target.value })}
                />

                <button>Simpan</button>
              </form>
            </div>

            <div className="card">
              {products.map(p => (
                <div key={p.id}>
                  <b>{p.nama}</b>
                  <button onClick={() => editProduct(p)}>Edit</button>
                  <button onClick={() => deleteProduct(p.id)}>Hapus</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
'use client'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { useRouter } from 'next/navigation'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"

const BASE_URL_GAMBAR = "/menu/"
const PLACEHOLDER_IMG = "/placeholder.png"

export default function Admin() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    id: '',
    nama: '',
    punya_varian: true,
    harga_lite: '',
    harga_healthy: '',
    harga_sultan: '',
    stok: '',
    stok_lite: '',
    stok_healthy: '',
    stok_sultan: '',
    deskripsi: '',
    gambar_url: ''
  })

  useEffect(() => {
    fetch('/api/checkRole')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then(data => {
        if (data.role !== 'admin') {
          router.replace('/kasir')
        } else {
          setLoading(false)
        }
      })
      .catch(() => router.replace('/'))
  }, [router])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setSession(user)
        loadProducts()
      } else {
        router.replace('/')
      }
    })
    return () => unsub()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    await signOut(auth)
    window.location.href = '/'
  }

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, 'products'))
    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))
    setProducts(data)
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        nama: form.nama,
        punya_varian: form.punya_varian,
        deskripsi: form.deskripsi,
        gambar_url: form.gambar_url.startsWith("http")
          ? form.gambar_url
          : BASE_URL_GAMBAR + form.gambar_url,
      }

      if (form.id) {
        await updateDoc(doc(db, 'products', form.id), payload)
      } else {
        payload.created_at = serverTimestamp()
        await addDoc(collection(db, 'products'), payload)
      }

      resetForm()
      loadProducts()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm({
      id: '',
      nama: '',
      punya_varian: true,
      harga_lite: '',
      harga_healthy: '',
      harga_sultan: '',
      stok: '',
      stok_lite: '',
      stok_healthy: '',
      stok_sultan: '',
      deskripsi: '',
      gambar_url: ''
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
      nama: p.nama || '',
      punya_varian: p.punya_varian ?? true,
      deskripsi: p.deskripsi || '',
      gambar_url: (p.gambar_url || '').replace(BASE_URL_GAMBAR, '')
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <div style={{ padding: 20 }}>Checking access...</div>

  return (
    <>
      <Head>
        <title>Admin TotalGo</title>
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <h1>Admin TotalGo</h1>
              <p>{session?.email}</p>
            </div>
            <button onClick={handleLogout}>Logout</button>
          </header>

          <form onSubmit={saveProduct} style={styles.card}>
            <input
              placeholder="Nama Produk"
              value={form.nama}
              onChange={e => setForm({ ...form, nama: e.target.value })}
            />
            <input
              placeholder="Gambar"
              value={form.gambar_url}
              onChange={e => setForm({ ...form, gambar_url: e.target.value })}
            />
            <button disabled={saving}>
              {saving ? "Saving..." : "Simpan"}
            </button>
          </form>

          <div style={styles.card}>
            {products.map(p => (
              <div key={p.id} style={styles.productItem}>
                <div style={styles.left}>
                  <img
                    src={p.gambar_url || PLACEHOLDER_IMG}
                    style={styles.img}
                    alt=""
                  />
                  <div>
                    <b>{p.nama}</b>
                  </div>
                </div>

                <div>
                  <button onClick={() => editProduct(p)}>Edit</button>
                  <button onClick={() => deleteProduct(p.id)}>Hapus</button>
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
  page: { background: '#000', color: '#fff', minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: 16 },
  header: { display: 'flex', justifyContent: 'space-between' },
  card: { background: '#111', padding: 16, marginTop: 16 },
  productItem: { display: 'flex', justifyContent: 'space-between', marginTop: 12 },
  left: { display: 'flex', gap: 10, alignItems: 'center' },
  img: { width: 50, height: 50, objectFit: 'cover' }
}
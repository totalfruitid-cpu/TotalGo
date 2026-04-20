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
    data.sort((a, b) =>
      (b.created_at?.toMillis?.() || 0) -
      (a.created_at?.toMillis?.() || 0)
    )
    setProducts(data)
  }

  const sanitizeNumber = (v) => {
    if (v === '' || v === null || v === undefined) return null
    const num = Number(String(v).replace(/[^\d.-]/g, ''))
    return Number.isFinite(num) ? num : null
  }

  const buildPayload = () => {
    const gambar = form.gambar_url?.trim()
      ? (form.gambar_url.startsWith("http")
        ? form.gambar_url
        : BASE_URL_GAMBAR + form.gambar_url)
      : ""

    const toNum = (val) => {
      const n = sanitizeNumber(val)
      return n === null ? 0 : n
    }

    const base = {
      nama: form.nama.trim(),
      punya_varian: form.punya_varian,
      deskripsi: form.deskripsi,
      gambar_url: gambar
    }

    if (form.punya_varian) {
      return {
        ...base,
        harga_lite: toNum(form.harga_lite),
        harga_healthy: toNum(form.harga_healthy),
        harga_sultan: toNum(form.harga_sultan),
        stok_lite: toNum(form.stok_lite),
        stok_healthy: toNum(form.stok_healthy),
        stok_sultan: toNum(form.stok_sultan)
      }
    }

    return {
      ...base,
      harga_lite: toNum(form.harga_lite),
      stok: toNum(form.stok)
    }
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    if (!form.nama.trim()) return alert("Nama wajib diisi")

    setSaving(true)
    try {
      const payload = buildPayload()

      if (form.id) {
        await updateDoc(doc(db, 'products', form.id), payload)
      } else {
        payload.created_at = serverTimestamp()
        await addDoc(collection(db, 'products'), payload)
      }

      resetForm()
      await loadProducts()
    } catch (err) {
      alert(err.message)
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
      harga_lite: p.harga_lite ?? '',
      harga_healthy: p.harga_healthy ?? '',
      harga_sultan: p.harga_sultan ?? '',
      stok: p.stok ?? '',
      stok_lite: p.stok_lite ?? '',
      stok_healthy: p.stok_healthy ?? '',
      stok_sultan: p.stok_sultan ?? '',
      deskripsi: p.deskripsi || '',
      gambar_url: (p.gambar_url || '').replace(BASE_URL_GAMBAR, '')
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <div style={styles.loading}>Checking access...</div>

  return (
    <>
      {/* ✅ PWA HEAD FIXED */}
      <Head>
        <title>Admin TotalGo</title>
        <meta name="description" content="Dashboard admin TotalGo" />

        <link rel="manifest" href="/manifest.admin.json" />
        <meta name="theme-color" content="#ea580c" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Admin TotalGo" />
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <h1 style={styles.h1}>Admin TotalGo</h1>
              <p style={styles.email}>{session?.email}</p>
            </div>
            <button onClick={handleLogout} style={styles.btnLogout}>
              Logout
            </button>
          </header>

          {/* FORM */}
          <div style={styles.card}>
            <h2 style={styles.h2}>
              {form.id ? "Edit Produk" : "Tambah Produk"}
            </h2>

            <form onSubmit={saveProduct}>
              <input
                placeholder="Nama Produk"
                value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                style={styles.input}
              />

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.punya_varian}
                  onChange={e => setForm({ ...form, punya_varian: e.target.checked })}
                />
                Punya Varian
              </label>

              <button style={styles.btnPrimary} disabled={saving}>
                {saving ? "Menyimpan..." : form.id ? "Update" : "S

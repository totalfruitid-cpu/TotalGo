import { useState, useEffect } from 'react'
import Head from 'next/head'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc
} from "firebase/firestore"

const BASE_URL_GAMBAR = "/menu/"
const PLACEHOLDER_IMG = "/placeholder.png"

export default function Admin() {
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false) // PATCH 3: Anti double-click

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

  // =====================
  // AUTH CHECK
  // =====================
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
        await loadProducts()
      } catch (err) {
        console.error(err)
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

  // =====================
  // LOAD PRODUCTS
  // =====================
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

  // =====================
  // SANITIZE NUMBER - PRO VERSION
  // =====================
  // PATCH 2: Return null kalo invalid/kosong. Biar ketauan bedanya input error vs sengaja 0
  const sanitizeNumber = (v) => {
    if (v === '' || v === null || v === undefined) return null
    const num = Number(String(v).replace(/[^\d.-]/g, ''))
    return Number.isFinite(num) ? num : null
  }

  // =====================
  // BUILD PAYLOAD - NULL SAFE
  // =====================
  const buildPayload = () => {
    const gambar = form.gambar_url?.trim()
      ? (form.gambar_url.startsWith("http")
          ? form.gambar_url
          : BASE_URL_GAMBAR + form.gambar_url)
      : ""

    // Convert null ke 0 sebelum kirim ke Firestore biar Rules V3.5 lolos
    // Tapi kita tau bedanya karena di form masih null
    const toFirestoreNum = (val) => {
      const sanitized = sanitizeNumber(val)
      return sanitized === null ? 0 : sanitized
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
        harga_lite: toFirestoreNum(form.harga_lite),
        harga_healthy: toFirestoreNum(form.harga_healthy),
        harga_sultan: toFirestoreNum(form.harga_sultan),
        stok_lite: toFirestoreNum(form.stok_lite),
        stok_healthy: toFirestoreNum(form.stok_healthy),
        stok_sultan: toFirestoreNum(form.stok_sultan)
      }
    }

    return {
      ...base,
      harga_lite: toFirestoreNum(form.harga_lite),
      stok: toFirestoreNum(form.stok)
    }
  }

  // =====================
  // SAVE
  // =====================
  const saveProduct = async (e) => {
    e.preventDefault()

    if (!form.nama.trim()) {
      alert("Nama produk wajib diisi")
      return
    }

    // PATCH 1: Validasi harga 0 itu valid. Ceknya 'gak diisi sama sekali'
    if (form.punya_varian) {
      const adaHargaDiisi = [form.harga_lite, form.harga_healthy, form.harga_sultan]
        .some(h => h !== '' && h !== null)
      if (!adaHargaDiisi) {
        alert("Minimal isi 1 harga varian")
        return
      }
    } else {
      if (form.harga_lite === '' || form.harga_lite === null) {
        alert("Harga wajib diisi")
        return
      }
    }

    setSaving(true) // PATCH 3: Lock button
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
      console.error(err)
      alert(err.message)
    } finally {
      setSaving(false) // PATCH 3: Unlock button
    }
  }

  // =====================
  // RESET
  // =====================
  const resetForm = () => {
    setForm({
      id: '',
      nama: '',
      punya_varian: true,
      harga_lite: '',
      harga_healthy: '',
      harga_sultan: '',
      stok_lite: '',
      stok_healthy: '',
      stok_sultan: '',
      deskripsi: '',
      gambar_url: ''
    })
  }

  // =====================
  // DELETE
  // =====================
  const deleteProduct = async (id) => {
    if (!confirm('Hapus produk?')) return
    await deleteDoc(doc(db, 'products', id))
    loadProducts()
  }

  // =====================
  // EDIT
  // =====================
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

  // =====================
  // UI
  // =====================
  if (loading) return <div style={styles.loading}>Loading...</div>

  return (
    <>
      <Head>
        <title>Admin TotalGo</title>
      </Head>

      <div style={styles.page}>
        <div style={styles.container}>

          {/* HEADER */}
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
                required
              />

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.punya_varian}
                  onChange={e => setForm({ ...form, punya_varian: e.target.checked })}
                />
                Punya Varian Lite / Healthy / Sultan
              </label>

              {form.punya_varian ? (
                <div style={styles.grid2}>
                  <input placeholder="Harga Lite" type="text" inputMode="numeric"
                    value={form.harga_lite}
                    onChange={e => setForm({ ...form, harga_lite: e.target.value })}
                    style={styles.input}
                  />
                  <input placeholder="Stok Lite" type="text" inputMode="numeric"
                    value={form.stok_lite}
                    onChange={e => setForm({ ...form, stok_lite: e.target.value })}
                    style={styles.input}
                  />

                  <input placeholder="Harga Healthy" type="text" inputMode="numeric"
                    value={form.harga_healthy}
                    onChange={e => setForm({ ...form, harga_healthy: e.target.value })}
                    style={styles.input}
                  />
                  <input placeholder="Stok Healthy" type="text" inputMode="numeric"
                    value={form.stok_healthy}
                    onChange={e => setForm({ ...form, stok_healthy: e.target.value })}
                    style={styles.input}
                  />

                  <input placeholder="Harga Sultan" type="text" inputMode="numeric"
                    value={form.harga_sultan}
                    onChange={e => setForm({ ...form, harga_sultan: e.target.value })}
                    style={styles.input}
                  />
                  <input placeholder="Stok Sultan" type="text" inputMode="numeric"
                    value={form.stok_sultan}
                    onChange={e => setForm({ ...form, stok_sultan: e.target.value })}
                    style={styles.input}
                  />
                </div>
              ) : (
                <div style={styles.grid2}>
                  <input placeholder="Harga" type="text" inputMode="numeric"
                    value={form.harga_lite}
                    onChange={e => setForm({ ...form, harga_lite: e.target.value })}
                    style={styles.input}
                  />
                  <input placeholder="Stok" type="text" inputMode="numeric"
                    value={form.stok}
                    onChange={e => setForm({ ...form, stok: e.target.value })}
                    style={styles.input}
                  />
                </div>
              )}

              <textarea
                placeholder="Deskripsi"
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                style={{ ...styles.input, height: 80 }}
              />

              <input
                placeholder="Gambar (nama file / url)"
                value={form.gambar_url}
                onChange={e => setForm({ ...form, gambar_url: e.target.value })}
                style={styles.input}
              />

              <div style={styles.btnGroup}>
                {/* PATCH 3: Disable pas saving */}
                <button style={styles.btnPrimary} disabled={saving}>
                  {saving ? "Menyimpan..." : form.id ? "Update" : "Simpan"}
                </button>

                {form.id && (
                  <button type="button" onClick={resetForm} style={styles.btnSecondary} disabled={saving}>
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* LIST */}
          <div style={styles.card}>
            <h2 style={styles.h2}>List Produk</h2>

            {products.length === 0 ? (
              <p style={styles.empty}>Belum ada produk</p>
            ) : (
              products.map(p => (
                <div key={p.id} style={styles.productItem}>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={(p.gambar_url?.trim() || PLACEHOLDER_IMG)}
                      style={styles.img}
                      alt={p.nama}
                      onError={(e) => (e.target.src = PLACEHOLDER_IMG)}
                    />

                    <div>
                      <b>{p.nama}</b>
                      <p style={styles.desc}>
                        {p.punya_varian
                          ? `Lite:${p.harga_lite ?? 0} | Healthy:${p.harga_healthy ?? 0} | Sultan:${p.harga_sultan ?? 0}`
                          : `Harga:${p.harga_lite ?? 0} | Stok:${p.stok ?? 0}`}
                      </p>
                    </div>
                  </div>

                  <div style={styles.btnGroup}>
                    <button onClick={() => editProduct(p)} style={styles.btnEdit}>Edit</button>
                    <button onClick={() => deleteProduct(p.id)} style={styles.btnDelete}>Hapus</button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  )
}

// =====================
// STYLE
// =====================
const styles = {
  page: { background: '#000', color: '#fff', minHeight: '100vh' },
  container: { maxWidth: 480, margin: '0 auto', padding: 16 },
  loading: { padding: 20 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 20 },
  h1: { fontSize: 22 },
  h2: { fontSize: 18, marginBottom: 12 },
  email: { fontSize: 12, color: '#888' },
  card: { background: '#111', padding: 16, borderRadius: 16, marginBottom: 16 },
  input: { width: '100%', padding: 10, marginBottom: 10, background: '#222', color: '#fff', borderRadius: 8, border: '1px solid #333' },
  checkboxLabel: { display: 'flex', gap: 8, marginBottom: 10 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  btnGroup: { display: 'flex', gap: 8 },
  btnPrimary: { flex: 1, padding: 10, background: '#fff', color: '#000', borderRadius: 8, border: 'none', cursor: 'pointer' },
  btnSecondary: { flex: 1, padding: 10, background: '#333', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' },
  btnLogout: { padding: 8, background: '#222', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' },
  btnEdit: { padding: 6, background: '#333', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer' },
  btnDelete: { padding: 6, background: '#900', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer' },
  productItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' },
  img: { width: 50, height: 50, objectFit: 'cover', borderRadius: 10 },
  desc: { fontSize: 12, color: '#888' },
  empty: { textAlign: 'center', color: '#666' }
}
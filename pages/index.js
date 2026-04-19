import { useState, useEffect } from "react";
import Head from "next/head";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

const BASE_URL_GAMBAR = "/menu/";
const PLACEHOLDER_IMG = "/placeholder.png";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  });

  // =====================
  // AUTH CHECK
  // =====================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return window.location.href = '/login';

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists() || snap.data().role !== "admin") {
          await signOut(auth);
          return window.location.href = '/login';
        }

        setSession(user);
        await loadProducts();
      } catch (err) {
        console.error(err);
        await signOut(auth);
        window.location.href = '/login';
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  // =====================
  // LOAD PRODUCTS
  // =====================
  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"));

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    data.sort((a, b) =>
      (b.created_at?.toMillis?.() || 0) -
      (a.created_at?.toMillis?.() || 0)
    );

    setProducts(data);
  };

  // =====================
  // IMAGE FIX
  // =====================
  const getImageUrl = (img) => {
    if (!img) return PLACEHOLDER_IMG;
    if (img.startsWith("http")) return img;
    return BASE_URL_GAMBAR + img;
  };

  // =====================
  // SAVE
  // =====================
  const saveProduct = async (e) => {
    e.preventDefault();

    if (!form.nama.trim()) {
      alert("Nama produk wajib diisi");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        nama: form.nama.trim(),
        punya_varian: form.punya_varian,
        deskripsi: form.deskripsi,
        gambar_url: form.gambar_url?.trim() || ""
      };

      const toNum = (v) =>
        v === "" || v == null ? null : Number(v);

      if (form.punya_varian) {
        payload.harga_lite = toNum(form.harga_lite);
        payload.harga_healthy = toNum(form.harga_healthy);
        payload.harga_sultan = toNum(form.harga_sultan);
        payload.stok_lite = toNum(form.stok_lite);
        payload.stok_healthy = toNum(form.stok_healthy);
        payload.stok_sultan = toNum(form.stok_sultan);
      } else {
        payload.harga_lite = toNum(form.harga_lite);
        payload.stok = toNum(form.stok);
      }

      if (form.id) {
        await updateDoc(doc(db, "products", form.id), payload);
      } else {
        payload.created_at = serverTimestamp();
        await addDoc(collection(db, "products"), payload);
      }

      resetForm();
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

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
    });
  };

  const deleteProduct = async (id) => {
    if (!confirm("Hapus produk?")) return;
    await deleteDoc(doc(db, "products", id));
    loadProducts();
  };

  const editProduct = (p) => {
    setForm({
      id: p.id,
      nama: p.nama || '',
      punya_varian: p.punya_varian === true || p.punya_varian === "true",
      harga_lite: p.harga_lite ?? '',
      harga_healthy: p.harga_healthy ?? '',
      harga_sultan: p.harga_sultan ?? '',
      stok: p.stok ?? '',
      stok_lite: p.stok_lite ?? '',
      stok_healthy: p.stok_healthy ?? '',
      stok_sultan: p.stok_sultan ?? '',
      deskripsi: p.deskripsi || '',
      gambar_url: (p.gambar_url || '').replace(BASE_URL_GAMBAR, '')
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <>
      <Head>
        <title>Admin TotalGo</title>
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
            <h2 style={styles.h2}>{form.id ? "Edit Produk" : "Tambah Produk"}</h2>

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

              <input
                placeholder="Harga Lite"
                value={form.harga_lite}
                onChange={e => setForm({ ...form, harga_lite: e.target.value })}
                style={styles.input}
              />

              <input
                placeholder="Harga Healthy"
                value={form.harga_healthy}
                onChange={e => setForm({ ...form, harga_healthy: e.target.value })}
                style={styles.input}
              />

              <input
                placeholder="Harga Sultan"
                value={form.harga_sultan}
                onChange={e => setForm({ ...form, harga_sultan: e.target.value })}
                style={styles.input}
              />

              <input
                placeholder="Gambar (menu-avovado.png)"
                value={form.gambar_url}
                onChange={e => setForm({ ...form, gambar_url: e.target.value })}
                style={styles.input}
              />

              <button disabled={saving} style={styles.btnPrimary}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>

          {/* LIST */}
          <div style={styles.card}>
            <h2 style={styles.h2}>List Produk</h2>

            {products.map(p => (
              <div key={p.id} style={styles.productItem}>

                <div style={{ display: "flex", gap: 12 }}>
                  <img
                    src={getImageUrl(p.gambar_url)}
                    style={styles.img}
                  />

                  <div>
                    <b>{p.nama}</b>

                    {p.punya_varian ? (
                      <div>
                        <div>Lite: Rp {p.harga_lite ?? 0}</div>
                        <div>Healthy: Rp {p.harga_healthy ?? 0}</div>
                        <div>Sultan: Rp {p.harga_sultan ?? 0}</div>
                      </div>
                    ) : (
                      <div>Harga: Rp {p.harga_lite ?? 0}</div>
                    )}
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
  );
}

// =====================
const styles = {
  page: {
    background: "#0a0a0a",
    color: "#fff",
    minHeight: "100vh"
  },
  container: { maxWidth: 480, margin: "0 auto", padding: 16 },
  card: {
    background: "#121212",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    border: "1px solid #222"
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    background: "#222",
    color: "#fff",
    border: "1px solid #333",
    borderRadius: 8
  },
  btnPrimary: {
    width: "100%",
    padding: 10,
    background: "#fff",
    color: "#000",
    borderRadius: 8,
    border: "none",
    fontWeight: "bold"
  },
  img: {
    width: 50,
    height: 50,
    borderRadius: 10,
    objectFit: "cover"
  },
  productItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #222"
  },
  h2: { marginBottom: 10 },
  header: { display: "flex", justifyContent: "space-between" },
  btnLogout: { background: "#222", color: "#fff", border: "none", padding: 8 },
  email: { fontSize: 12, color: "#888" },
  h1: { fontSize: 20 },
  loading: { padding: 20 }
};
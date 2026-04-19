import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function Kasir() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const router = useRouter();

  const toRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  // 🔐 SECURITY CHECK (FIXED)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      try {
        const q = query(
          collection(db, "users"),
          where("email", "==", currentUser.email)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          router.push('/login');
          return;
        }

        const userData = snap.docs[0].data();

        // hanya kasir yang boleh masuk
        if (userData.role !== "kasir") {
          router.push('/login');
          return;
        }

        setUser(currentUser);
      } catch (err) {
        console.error(err);
        router.push('/login');
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 🔄 ORDER LIST
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "orders"), where("status", "==", "Baru"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ TERIMA PESANAN
  const terimaPesanan = async (order) => {
    try {
      await runTransaction(db, async (transaction) => {
        const productDocs = [];

        for (const item of order.items || []) {
          if (!item.productId) continue;

          const productRef = doc(db, "products", item.productId);
          const productSnap = await transaction.get(productRef);

          productDocs.push({
            ref: productRef,
            doc: productSnap,
            item
          });
        }

        for (const { doc: productDoc, item } of productDocs) {
          if (!productDoc.exists()) {
            throw new Error(`Produk ${item.nama} tidak ditemukan`);
          }

          const productData = productDoc.data();

          let fieldStok = 'stok';
          if (productData.punya_varian) {
            fieldStok = `stok_${item.varian}`;
          }

          const stokLama = productData[fieldStok] || 0;

          if (stokLama - item.qty < 0) {
            throw new Error(`Stok ${item.nama} kurang`);
          }
        }

        const orderRef = doc(db, "orders", order.id);
        transaction.update(orderRef, { status: 'Diproses' });

        for (const { ref, doc: productDoc, item } of productDocs) {
          const productData = productDoc.data();

          let fieldStok = 'stok';
          if (productData.punya_varian) {
            fieldStok = `stok_${item.varian}`;
          }

          const stokBaru = (productData[fieldStok] || 0) - item.qty;

          transaction.update(ref, {
            [fieldStok]: stokBaru
          });
        }
      });

      alert('Pesanan diterima & stok berkurang');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ✅ SELESAI PESANAN
  const selesaikanPesanan = async (id) => {
    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, "orders", id);
        transaction.update(ref, { status: 'Selesai' });
      });

      alert('Pesanan selesai');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Head>
        <title>Kasir TotalGo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest-kasir.json" />
        <meta name="theme-color" content="#16a34a" />
      </Head>

      <div className="container">
        <div className="header">
          <h1>Dashboard Kasir TotalGo</h1>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>

        <h2>Pesanan Masuk</h2>

        <table>
          <thead>
            <tr>
              <th>Antrian</th>
              <th>Nama</th>
              <th>Pesanan</th>
              <th>Total</th>
              <th>Metode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.queue}</td>
                <td>{order.nama}</td>
                <td>
                  {order.items?.map((item, i) => (
                    <div key={i}>
                      {item.nama} {item.varian !== 'single' ? item.varian : ''} x{item.qty}
                    </div>
                  ))}
                </td>
                <td>{toRupiah(order.total)}</td>
                <td>{order.metode}</td>
                <td>{order.status}</td>
                <td>
                  <button onClick={() => terimaPesanan(order)} className="btn-terima">
                    Terima
                  </button>
                  <button onClick={() => selesaikanPesanan(order.id)} className="btn-selesai">
                    Selesai
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        body { font-family: sans-serif; background: #f8f9fa; }
        .container { max-width: 1200px; margin: auto; padding: 20px; }
        .header { display:flex; justify-content:space-between; margin-bottom:20px; }
        table { width:100%; background:white; border-collapse:collapse; }
        th,td { padding:12px; border-bottom:1px solid #ddd; }
        .btn-terima { background:green; color:white; padding:6px 10px; }
        .btn-selesai { background:blue; color:white; padding:6px 10px; }
        .btn-logout { background:red; color:white; padding:8px 12px; }
      `}</style>
    </>
  );
}
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { toRupiah } from '../utils/formatters';

export default function Kasir() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), where("status", "==", "Baru"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id }));
      setOrders(ordersData);
    });
    return () => unsubscribe();
  }, [user]);

  const terimaPesanan = async (order) => {
    try {
      await runTransaction(db, async (transaction) => {
        // TAHAP 1: BACA SEMUA DATA DULU
        const productDocs = [];

        for (const item of order.items || []) {
          if (!item.productId) continue; // Skip order lama yg gak ada productId

          const productRef = doc(db, "products", item.productId);
          const productDoc = await transaction.get(productRef);
          productDocs.push({ ref: productRef, doc: productDoc, item: item });
        }

        // TAHAP 2: VALIDASI STOK SEBELUM NULIS APAPUN
        for (const { doc: productDoc, item } of productDocs) {
          if (!productDoc.exists()) {
            throw new Error(`Produk ${item.nama} gak ketemu di database`);
          }

          const productData = productDoc.data();
          let fieldStok = 'stok';

          if (productData.punya_varian) {
            if (!item.varian || item.varian === 'single') {
              throw new Error(`Item ${item.nama} harusnya punya varian`);
            }
            fieldStok = `stok_${item.varian}`;
          }

          const stokLama = productData[fieldStok]?? 0;
          if (stokLama - item.qty < 0) {
            throw new Error(`Stok ${item.nama} ${item.varian || ''} kurang! Sisa: ${stokLama}`);
          }
        }

        // TAHAP 3: BARU LAKUIN SEMUA WRITE SETELAH BACA KELAR
        const orderRef = doc(db, "orders", order.id);
        transaction.update(orderRef, { status: 'Diproses' });

        for (const { ref: productRef, doc: productDoc, item } of productDocs) {
          const productData = productDoc.data();
          let fieldStok = 'stok';
          if (productData.punya_varian) {
            fieldStok = `stok_${item.varian}`;
          }
          const stokBaru = (productData[fieldStok]?? 0) - item.qty;
          transaction.update(productRef, { [fieldStok]: stokBaru });
        }
      });

      alert('Pesanan diterima & stok udah dikurangi');
    } catch (err) {
      console.error("ERROR DETAIL KASIR:", err);
      alert('Gagal proses: ' + err.message);
    }
  };

  const selesaikanPesanan = async (id) => {
    const orderRef = doc(db, "orders", id);
    try {
      await runTransaction(db, async (transaction) => {
        transaction.update(orderRef, { status: 'Selesai' });
      });
      alert('Pesanan selesai');
    } catch (err) {
      alert('Gagal menyelesaikan: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container">
      <style jsx global>{`
        body { background-color: #f8f9fa; font-family: sans-serif; }
       .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
       .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        h1 { font-size: 2.5rem; }
        table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        th, td { padding: 15px; border-bottom: 1px solid #ddd; text-align: left; }
        th { background-color: #f2f2f2; }
       .btn-terima { background-color: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; margin-right: 5px; }
       .btn-selesai { background-color: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; }
       .btn-logout { background-color: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
      `}</style>
      <div className="header">
        <h1>Dashboard Kasir TotalGo</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
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
              <td>{order.nama} <br/> <small>{order.metode}</small></td>
              <td>
                {order.items?.map((item, idx) => (
                  <div key={idx}>{item.nama} {item.varian!== 'single'? item.varian : ''} x{item.qty}</div>
                ))}
              </td>
              <td>{toRupiah(order.total)}</td>
              <td>{order.metode}</td>
              <td>{order.status}</td>
              <td>
                <button onClick={() => terimaPesanan(order)} className="btn-terima">Terima</button>
                <button onClick={() => selesaikanPesanan(order.id)} className="btn-selesai">Selesai</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
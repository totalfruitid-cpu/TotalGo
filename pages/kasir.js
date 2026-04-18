import { useEffect, useState } from 'react';
import { db } from "../lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function Kasir() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Hapus orderBy dulu biar gak error kalo field created_at gaada
    const q = query(collection(db, "orders"));
    
    const unsub = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort manual di sini biar aman
        data.sort((a, b) => {
          const timeA = a.created_at?.seconds || 0;
          const timeB = b.created_at?.seconds || 0;
          return timeB - timeA;
        });
        setOrders(data);
        setLoading(false);
        setError('');
      }, 
      (err) => {
        console.error("Error Firestore:", err);
        setError('Gagal load data: ' + err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const terimaPesanan = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: 'Diproses' });
    } catch (err) {
      alert('Gagal update: ' + err.message);
    }
  };

  const selesaiPesanan = async (id) => {
    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (err) {
      alert('Gagal hapus: ' + err.message);
    }
  };

  const totalHariIni = orders
    .filter(o => o.status === 'Diproses')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Dashboard Kasir TotalGo</h1>
      <h3>Total Pemasukan Diproses: Rp {totalHariIni.toLocaleString()}</h3>
      
      <h2>Pesanan Masuk</h2>
      {orders.length === 0 ? (
        <p>Belum ada pesanan masuk.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
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
            {orders.map((order) => (
              <tr key={order.id}>
                <td><b>{order.queue}</b></td>
                <td>{order.nama}<br/><small>{order.alamat}</small></td>
                <td>{order.items && order.items.map(i => `${i.nama} x${i.qty}`).join(', ')}</td>
                <td>Rp {(order.total || 0).toLocaleString()}</td>
                <td>{order.metode}</td>
                <td><b>{order.status || 'Baru'}</b></td>
                <td>
                  {order.status !== 'Diproses' && (
                    <button onClick={() => terimaPesanan(order.id)} style={{ marginRight: 5 }}>
                      Terima
                    </button>
                  )}
                  <button onClick={() => selesaiPesanan(order.id)}>
                    Selesai
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
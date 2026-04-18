import { useEffect, useState } from 'react';
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function Kasir() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const terimaPesanan = async (id) => {
    await updateDoc(doc(db, "orders", id), { status: 'Diproses' });
  };

  const selesaiPesanan = async (id) => {
    await deleteDoc(doc(db, "orders", id));
  };

  const totalHariIni = orders
    .filter(o => o.status === 'Diproses')
    .reduce((sum, o) => sum + o.total, 0);

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

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
                <td>Rp {order.total.toLocaleString()}</td>
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
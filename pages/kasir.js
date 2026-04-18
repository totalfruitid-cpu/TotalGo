import { useEffect, useState } from 'react';
import { db, auth } from "../lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, runTransaction } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

export default function Kasir() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, "orders"));
    const unsub = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
        data.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
        setOrders(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError('Gagal load data: ' + err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert('Login gagal: ' + err.message);
    }
  };

  const handleLogout = () => signOut(auth);

  // UPGRADE: Terima pesanan + kurangi stok pake Transaction
  const terimaPesanan = async (order) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Update status order jadi 'Diproses'
        const orderRef = doc(db, "orders", order.id);
        transaction.update(orderRef, { status: 'Diproses' });

        // 2. Loop semua item, kurangi stok di collection 'menu'
        if (!order.items || order.items.length === 0) return;

        for (const item of order.items) {
          if (!item.menuId) throw new Error(`Item ${item.nama} gak ada menuId`);

          const menuRef = doc(db, "menu", item.menuId);
          const menuDoc = await transaction.get(menuRef);

          if (!menuDoc.exists()) throw new Error(`Menu ${item.nama} gak ketemu di database`);

          const stokLama = menuDoc.data().stok || 0;
          const stokBaru = stokLama - item.qty;

          if (stokBaru < 0) throw new Error(`Stok ${item.nama} kurang! Sisa: ${stokLama}`);

          transaction.update(menuRef, { stok: stokBaru });
        }
      });
      alert('Pesanan diterima & stok udah dikurangi');
    } catch (err) {
      alert('Gagal proses: ' + err.message);
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

  if (!user) {
    return (
      <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 300, margin: 'auto', marginTop: 100 }}>
        <h2>Login Kasir TotalGo</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email Kasir" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 10 }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 10 }} />
          <button type="submit" style={{ width: '100%', padding: 10 }}>Login</button>
        </form>
      </div>
    );
  }

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Dashboard Kasir TotalGo</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <h3>Total Pemasukan Diproses: Rp {totalHariIni.toLocaleString()}</h3>
      <h2>Pesanan Masuk</h2>
      {orders.length === 0? (
        <p>Belum ada pesanan masuk.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f0f0f0' }}><th>Antrian</th><th>Nama</th><th>Pesanan</th><th>Total</th><th>Metode</th><th>Status</th><th>Aksi</th></tr></thead>
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
                  {order.status!== 'Diproses' && <button onClick={() => terimaPesanan(order)} style={{ marginRight: 5 }}>Terima</button>}
                  <button onClick={() => selesaiPesanan(order.id)}>Selesai</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
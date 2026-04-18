import { useEffect, useState } from 'react';

export default function Kasir() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('pesanan') || '[]');
    setOrders(data);
    setLoading(false);
  }, []);

  const terimaPesanan = (id) => {
    const newOrders = orders.map(order => 
      order.id === id ? { ...order, status: 'Diproses' } : order
    );
    setOrders(newOrders);
    localStorage.setItem('pesanan', JSON.stringify(newOrders));
  };

  const selesaiPesanan = (id) => {
    const newOrders = orders.filter(order => order.id !== id);
    setOrders(newOrders);
    localStorage.setItem('pesanan', JSON.stringify(newOrders));
  };

  const tambahDummy = () => {
    const dummy = {id: Date.now(), nama:'Customer Tes', items:[{nama:'Paket Sultan', qty:1}], total:25000, status:'Baru'};
    const newOrders = [...orders, dummy];
    setOrders(newOrders);
    localStorage.setItem('pesanan', JSON.stringify(newOrders));
  };

  const totalHariIni = orders
    .filter(o => o.status === 'Diproses')
    .reduce((sum, o) => sum + o.total, 0);

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Dashboard Kasir TotalGo</h1>
      <h3>Total Pemasukan Diproses: Rp {totalHariIni.toLocaleString()}</h3>
      <button onClick={tambahDummy} style={{marginBottom:20, padding:10}}>Tambah Pesanan Dummy</button>
      
      <h2>Pesanan Masuk</h2>
      {orders.length === 0 ? (
        <p>Belum ada pesanan masuk.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th>Nama</th>
              <th>Pesanan</th>
              <th>Total</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.nama}</td>
                <td>{order.items && order.items.map(i => `${i.nama} x${i.qty}`).join(', ')}</td>
                <td>Rp {order.total.toLocaleString()}</td>
                <td><b>{order.status || 'Baru'}</b></td>
                <td>
                  {order.status !== 'Diproses' && <button onClick={() => terimaPesanan(order.id)}>Terima</button>}
                  <button onClick={() => selesaiPesanan(order.id)} style={{marginLeft:5}}>Selesai</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
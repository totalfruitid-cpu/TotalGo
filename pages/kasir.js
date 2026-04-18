import { useEffect, useState } from 'react';

export default function Kasir() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil data pesanan dari API / localStorage / Firebase lu
  useEffect(() => {
    // GANTI BAGIAN INI SESUAI DATABASE LU
    // Contoh pake localStorage dulu biar jalan:
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
    alert('Pesanan diterima!');
  };

  const selesaiPesanan = (id) => {
    const newOrders = orders.filter(order => order.id !== id);
    setOrders(newOrders);
    localStorage.setItem('pesanan', JSON.stringify(newOrders));
    alert('Pesanan selesai!');
  };

  const totalHariIni = orders
    .filter(o => o.status === 'Diproses')
    .reduce((sum, o) => sum + o.total, 0);

  if (loading) return <p>Loading...</p>;

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
               
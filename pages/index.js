import { useState, useEffect } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import Head from 'next/head';

const supabase = createClient(
  'https://ynnnwppyarvxtpuonnha.supabase.co',
  'sb_publishable_d_kXZ7IGuFdqQQHKv0zUTg_vCp9OnwN'
)

const WA_NUMBER = '6285124441513';

const playClick = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
};

const generateQueueNumber = () => {
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const key = `queue_${dateStr}`;
  const lastQueue = parseInt(localStorage.getItem(key) || '0');
  const newQueue = lastQueue + 1;
  localStorage.setItem(key, newQueue);
  return `TG${dateStr}-${String(newQueue).padStart(3, '0')}`;
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [search, setSearch] = useState('');

  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [metode, setMetode] = useState('Ambil di Tempat');
  const [orderData, setOrderData] = useState(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('produk').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (showReceipt && orderData) {
      setTimeout(() => { window.print(); }, 800);
    }
  }, [showReceipt, orderData]);

  const addToCart = (product, size, harga) => {
    playClick();
    const key = `${product.id}-${size || 'single'}`;
    const exist = cart.find(i => i.key === key);
    if (exist) {
      setCart(cart.map(i => i.key === key? {...i, qty: i.qty + 1} : i));
    } else {
      setCart([...cart, {...product, size: size, harga: harga, qty: 1, key: key}]);
    }
  };

  const updateQty = (key, delta) => {
    playClick();
    setCart(cart.map(i => {
      if (i.key === key) {
        const newQty = i.qty + delta;
        return newQty > 0? {...i, qty: newQty} : null;
      }
      return i;
    }).filter(Boolean));
  };

  const getTotal = () => cart.reduce((sum, i) => sum + i.harga * i.qty, 0);

  const handleCheckout = () => {
    if (!nama) return alert('Isi nama dulu bro');
    if (metode === 'COD' &&!alamat) return alert('COD wajib isi alamat bro');

    const queue = generateQueueNumber();
    const data = {
      queue: queue,
      items: [...cart],
      total: getTotal(),
      nama: nama,
      alamat: metode === 'COD'? alamat : 'Ambil di Tempat',
      metode: metode,
      waktu: new Date().toLocaleString('id-ID')
    };

    setOrderData(data);
    setShowCheckout(false);
    setShowReceipt(true);

    let text = `*PESANAN TOTALGO*%0A`;
    text += `No. Antrian: *${queue}*%0A%0A`;
    data.items.forEach(i => {
      const namaItem = i.punya_varian? `${i.nama} ${i.size}` : i.nama;
      text += `- ${namaItem} x${i.qty} = Rp${(i.harga * i.qty).toLocaleString()}%0A`;
    });
    text += `%0ATotal: *Rp${data.total.toLocaleString()}*%0A`;
    text += `Nama: ${data.nama}%0A`;
    text += `Metode: ${data.metode}%0A`;
    if(metode === 'COD') text += `Alamat: ${data.alamat}%0A`;

    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, '_blank');
    setCart([]);
  };

  const closeReceipt = () => {
    playClick();
    setShowReceipt(false);
    setNama('');
    setAlamat('');
    setMetode('Ambil di Tempat');
  };

  const filteredProducts = products.filter(p => p.nama.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{padding: 32, textAlign: 'center'}}>Loading produk...</div>

  return (
    <>
      <Head>
        <title>TOTALGO - Jus Buah Segar Siap Antar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">
        <div className="header">
          <div className="header-top">
            <img src="/logo.png" alt="TotalGo" className="logo" />
            <div className="cart-icon" onClick={() => {playClick(); setShowCart(true)}}>
              🛒 {cart.length > 0 && <span>{cart.reduce((a,b) => a + b.qty, 0)}</span>}
            </div>
          </div>
          <h1>TOTALGO</h1>
          <p>Jus Buah Segar Siap Antar</p>
          <input
            className="search"
            placeholder="Cari jus..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="grid">
          {filteredProducts.length === 0? (
            <p style={{textAlign: 'center', gridColumn: '1/-1'}}>Belum ada produk. Tambah di /admin dulu bro</p>
          ) : filteredProducts.map(p => (
            <div key={p.id} className="card">
              <img src={p.gambar_url || 'https://via.placeholder.com/300'} alt={p.nama} />
              <h3>{p.nama}</h3>

              {p.punya_varian? (
                <div className="sizes">
                  <button onClick={() => addToCart(p, 'Lite', p.harga_lite)}>Lite<br/>Rp{p.harga_lite?.toLocaleString()}</button>
                  <button onClick={() => addToCart(p, 'Healthy', p.harga_healthy)}>Healthy<br/>Rp{p.harga_healthy?.toLocaleString()}</button>
                  <button onClick={() => addToCart(p, 'Sultan', p.harga_sultan)}>Sultan<br/>Rp{p.harga_sultan?.toLocaleString()}</button>
                </div>
              ) : (
                <div className="harga-single">
                  <p className="harga">Rp{Number(p.harga_lite).toLocaleString('id-ID')}</p>
                  <button className="add-btn" onClick={() => addToCart(p, '', p.harga_lite)}>+ Keranjang</button>
                </div>
              )}

              <p className="stok">Stok: {p.stok}</p>
            </div>
          ))}
        </div>

        {showCart && (
          <div className="modal" onClick={() => setShowCart(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Keranjang</h2>
              {cart.length === 0? <p>Kosong bro</p> : (
                <>
                  {cart.map(i => (
                    <div key={i.key} className="cart-item">
                      <div>
                        <b>{i.nama} {i.size}</b>
                        <p>Rp{(i.harga * i.qty).toLocaleString()}</p>
                      </div>
                      <div className="qty">
                        <button onClick={() => updateQty(i.key, -1)}>-</button>
                        <span>{i.qty}</span>
                        <button onClick={() => updateQty(i.key, 1)}>+</button>
                      </div>
                    </div>
                  ))}
                  <div className="total"><b>Total: Rp{getTotal().toLocaleString()}</b></div>
                  <button className="checkout" onClick={() => {playClick(); setShowCheckout(true)}}>Checkout</button>
                </>
              )}
              <button className="close" onClick={() => {playClick(); setShowCart(false)}}>Tutup</button>
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="modal" onClick={() => setShowCheckout(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Data Pesanan</h2>
              <input placeholder="Nama lengkap *" value={nama} onChange={e => setNama(e.target.value)} />

              <select value={metode} onChange={e => setMetode(e.target.value)}>
                <option value="Ambil di Tempat">Ambil di Tempat - Bayar di kasir</option>
                <option value="COD">COD - Antar ke alamat</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>

              {metode === 'COD' && (
                <textarea
                  placeholder="Alamat lengkap *wajib untuk COD"
                  value={alamat}
                  onChange={e => setAlamat(e.target.value)}
                />
              )}

              <button className="checkout" onClick={handleCheckout}>Kirim Pesanan</button>
              <button className="close" onClick={() => {playClick(); setShowCheckout(false)}}>Batal</button>
            </div>
          </div>
        )}

        {showReceipt && orderData && (
          <div className="modal receipt-modal">
            <div className="modal-content receipt" onClick={e => e.stopPropagation()}>
              <div className="receipt-content">
                <img src="/logo.png" alt="TotalGo" className="receipt-logo" />
                <h2>TOTALGO</h2>
                <p className="queue">No. Antrian</p>
                <h1 className="queue-num">{orderData.queue}</h1>
                <div className="line"></div>
                <p><b>{orderData.waktu}</b></p>
                <div className="line"></div>
                {orderData.items.map((i, idx) => (
                  <div key={idx} className="receipt-item">
                    <span>{i.nama} {i.size} x{i.qty}</span>
                    <span>Rp{(i.harga * i.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div className="line"></div>
                <div className="receipt-item total-row">
                  <b>TOTAL</b>
                  <b>Rp{orderData.total.toLocaleString()}</b>
                </div>
                <div className="line"></div>
                <p><b>Nama:</b> {orderData.nama}</p>
                <p><b>Metode:</b> {orderData.metode}</p>
                {orderData.metode === 'COD' && <p><b>Alamat:</b> {orderData.alamat}</p>}
                <div className="line"></div>
                <p className="thanks">Tunjukkan struk ini ke kasir</p>
                <p className="thanks">Order sudah dikirim ke WhatsApp</p>
              </div>
              <button className="close no-print" onClick={closeReceipt}>Pesanan Baru</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fefce8; font-family: sans-serif; }
        @media print {
          body { background: white; }
         .no-print,.header,.grid,.cart-icon,.modal:not(.receipt-modal) { display: none!important; }
         .receipt-modal { position: static; background: white; padding: 0; }
         .modal-content { box-shadow: none; max-width: 100%; border-radius: 0; }
        }
      `}</style>

      <style jsx>{`
       .wrap { max-width: 600px; margin: 0 auto; padding: 16px; }
       .header { margin-bottom: 20px; }
       .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
       .logo { height: 40px; }
       .cart-icon { font-size: 28px; cursor: pointer; position: relative; }
       .cart-icon span {
          position: absolute; top: -8px; right: -8px;
          background: #dc2626; color: white; border-radius: 50%;
          width: 20px; height: 20px; font-size: 12px;
          display: flex; align-items: center; justify-content: center; font-weight: 700;
        }
       .header h1 { text-align: center; color: #ea580c; font-size: 28px; font-weight: 800; letter-spacing: 1px; }
       .header p { text-align: center; color: #6b7280; font-size: 14px; margin: 4px 0 12px; }
       .search {
          width: 100%; padding: 12px; border: 1px solid #fcd34d;
          border-radius: 12px; background: white; font-size: 14px;
        }

       .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
       .card { background: white; border-radius: 16px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
       .card img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
       .card h3 { text-align: center; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #1f2937; }
       .sizes { display: flex; gap: 4px; margin-bottom: 6px; }
       .sizes button {
          flex: 1; background: #fef3c7; border: 1px solid #fcd34d;
          border-radius: 6px; padding: 6px 2px; font-size: 10px;
          line-height: 1.2; cursor: pointer; color: #92400e; font-weight: 600;
        }
       .sizes button:active { background: #fde68a; }
       .harga-single { text-align: center; margin-bottom: 6px; }
       .harga { color: #16a34a; font-weight: 700; font-size: 16px; margin: 4px 0; }
       .add-btn {
          width: 100%; background: #ea580c; color: white; border: none;
          border-radius: 8px; padding: 10px; font-weight: 700; cursor: pointer;
        }
       .add-btn:active { background: #c2410c; }
       .stok { text-align: center; font-size: 11px; color: #9ca3af; }

       .modal {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); display: flex;
          align-items: center; justify-content: center; z-index: 100; padding: 16px;
        }
       .modal-content {
          background: white; border-radius: 16px; padding: 20px;
          width: 100%; max-width: 400px; max-height: 80vh; overflow-y: auto;
        }
       .modal-content h2 { margin-bottom: 16px; color: #1f2937; }
       .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
       .cart-item p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
       .qty { display: flex; align-items: center; gap: 12px; }
       .qty button { width: 28px; height: 28px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; font-weight: 600; }
       .total { padding: 16px 0; text-align: right; font-size: 18px; }
       .checkout { width: 100%; padding: 14px; background: #ea580c; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 16px; margin-top: 8px; }
       .close { width: 100%; padding: 12px; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; cursor: pointer; margin-top: 8px; font-weight: 600; }
        input, textarea, select { width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; font-family: sans-serif; }
        textarea { min-height: 80px; resize: vertical; }

       .receipt { text-align: center; font-family: 'Courier New', monospace; }
       .receipt-content { font-size: 13px; line-height: 1.6; }
       .receipt-logo { height: 50px; margin: 0 auto 8px; }
       .queue { margin-top: 8px; color: #6b7280; font-size: 12px; }
       .queue-num { font-size: 36px; color: #ea580c; margin: 4px 0 8px; letter-spacing: 2px; }
       .line { border-top: 1px dashed #9ca3af; margin: 8px 0; }
       .receipt-item { display: flex; justify-content: space-between; margin: 4px 0; text-align: left; }
       .total-row { font-size: 16px; margin-top: 8px; }
       .thanks { font-size: 11px; color: #6b7280; margin-top: 4px; }
      `}</style>
    </>
  );
}
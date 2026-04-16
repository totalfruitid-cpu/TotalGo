import { useState } from 'react';
import Head from 'next/head';

const WA_NUMBER = '6285737557859';

// Data hardcode biar ga pusing API dulu. Nanti kalo udah jalan baru sambungin API.
const PRODUCTS = [
  {
    id: 1,
    nama: "AVOCADO SERIES",
    gambar: "/Menu-avocado.png",
    stok: 20,
    harga: { lite: 18000, healthy: 25000, sultan: 45000 }
  },
  {
    id: 2,
    nama: "MANGO SERIES",
    gambar: "/Menu-mango.png",
    stok: 15,
    harga: { lite: 18000, healthy: 25000, sultan: 45000 }
  },
  {
    id: 3,
    nama: "BANANA SERIES",
    gambar: "/Menu-banana.png",
    stok: 25,
    harga: { lite: 18000, healthy: 25000, sultan: 45000 }
  },
  {
    id: 4,
    nama: "STRAWBERRY SERIES",
    gambar: "/Menu-strawberry.png",
    stok: 10,
    harga: { lite: 18000, healthy: 25000, sultan: 45000 }
  },
  {
    id: 5,
    nama: "DRAGON SERIES",
    gambar: "/Menu-dragonfruit.png",
    stok: 12,
    harga: { lite: 18000, healthy: 25000, sultan: 45000 }
  }
];

export default function Home() {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [metode, setMetode] = useState('COD');

  const addToCart = (product, size) => {
    const exist = cart.find(i => i.id === product.id && i.size === size);
    if (exist) {
      setCart(cart.map(i => 
        i.id === product.id && i.size === size 
        ? {...i, qty: i.qty + 1} 
        : i
      ));
    } else {
      setCart([...cart, {...product, size: size, qty: 1}]);
    }
  };

  const updateQty = (id, size, delta) => {
    setCart(cart.map(i => {
      if (i.id === id && i.size === size) {
        const newQty = i.qty + delta;
        return newQty > 0 ? {...i, qty: newQty} : null;
      }
      return i;
    }).filter(Boolean));
  };

  const getTotal = () => {
    return cart.reduce((sum, i) => sum + i.harga[i.size.toLowerCase()] * i.qty, 0);
  };

  const handleCheckout = () => {
    if (!nama || !alamat) {
      alert('Isi nama & alamat dulu bro');
      return;
    }
    let text = `Halo TotalGo! Saya mau pesan:%0A%0A`;
    cart.forEach(i => {
      text += `- ${i.nama} ${i.size} x${i.qty} = Rp${(i.harga[i.size.toLowerCase()] * i.qty).toLocaleString()}%0A`;
    });
    text += `%0ATotal: Rp${getTotal().toLocaleString()}%0A`;
    text += `Nama: ${nama}%0AAlamat: ${alamat}%0APembayaran: ${metode}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, '_blank');
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);
  };

  return (
    <>
      <Head>
        <title>TOTALGO - Jus Buah Segar Siap Antar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="wrap">
        <div className="header">
          <h1>TOTALGO</h1>
          <p>Jus Buah Segar Siap Antar</p>
        </div>

        <div className="grid">
          {PRODUCTS.map(p => (
            <div key={p.id} className="card">
              <img src={p.gambar} alt={p.nama} />
              <h3>{p.nama}</h3>
              <div className="sizes">
                <button onClick={() => addToCart(p, 'Lite')}>
                  Lite<br/>Rp{p.harga.lite.toLocaleString()}
                </button>
                <button onClick={() => addToCart(p, 'Healthy')}>
                  Healthy<br/>Rp{p.harga.healthy.toLocaleString()}
                </button>
                <button onClick={() => addToCart(p, 'Sultan')}>
                  Sultan<br/>Rp{p.harga.sultan.toLocaleString()}
                </button>
              </div>
              <p className="stok">Stok: {p.stok}</p>
            </div>
          ))}
        </div>

        <button className="cart-fab" onClick={() => setShowCart(true)}>
          🛒 {cart.length > 0 && <span>{cart.reduce((a,b) => a + b.qty, 0)}</span>}
        </button>

        {showCart && (
          <div className="modal" onClick={() => setShowCart(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Keranjang</h2>
              {cart.length === 0 ? <p>Kosong bro</p> : (
                <>
                  {cart.map(i => (
                    <div key={`${i.id}-${i.size}`} className="cart-item">
                      <div>
                        <b>{i.nama} {i.size}</b>
                        <p>Rp{(i.harga[i.size.toLowerCase()] * i.qty).toLocaleString()}</p>
                      </div>
                      <div className="qty">
                        <button onClick={() => updateQty(i.id, i.size, -1)}>-</button>
                        <span>{i.qty}</span>
                        <button onClick={() => updateQty(i.id, i.size, 1)}>+</button>
                      </div>
                    </div>
                  ))}
                  <div className="total">
                    <b>Total: Rp{getTotal().toLocaleString()}</b>
                  </div>
                  <button className="checkout" onClick={() => setShowCheckout(true)}>
                    Checkout
                  </button>
                </>
              )}
              <button className="close" onClick={() => setShowCart(false)}>Tutup</button>
            </div>
          </div>
        )}

        {showCheckout && (
          <div className="modal" onClick={() => setShowCheckout(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Data Pengiriman</h2>
              <input 
                placeholder="Nama lengkap" 
                value={nama} 
                onChange={e => setNama(e.target.value)} 
              />
              <textarea 
                placeholder="Alamat lengkap" 
                value={alamat} 
                onChange={e => setAlamat(e.target.value)}
              />
              <select value={metode} onChange={e => setMetode(e.target.value)}>
                <option value="COD">COD - Bayar di tempat</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
              </select>
              <button className="checkout" onClick={handleCheckout}>
                Kirim ke WhatsApp
              </button>
              <button className="close" onClick={() => setShowCheckout(false)}>Batal</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fefce8; font-family: sans-serif; }
      `}</style>
      
      <style jsx>{`
        .wrap { max-width: 600px; margin: 0 auto; padding: 16px; }
        .header { text-align: center; margin-bottom: 24px; padding-top: 16px; }
        .header h1 { color: #ea580c; font-size: 28px; font-weight: 800; letter-spacing: 1px; }
        .header p { color: #6b7280; font-size: 14px; margin-top: 4px; }
        
        .grid {
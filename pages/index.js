import { useState } from 'react';
import Head from 'next/head';

const WA_NUMBER = '6285737557859';

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
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); 
          gap: 16px; 
          padding-bottom: 80px;
        }
        .card { 
          background: white; border-radius: 16px; padding: 12px; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .card img { 
          width: 100%; height: 140px; object-fit: cover; 
          border-radius: 8px; margin-bottom: 8px; 
        }
        .card h3 { 
          text-align: center; font-size: 13px; font-weight: 700; 
          margin-bottom: 8px; color: #1f2937;
        }
        .sizes { display: flex; gap: 4px; margin-bottom: 6px; }
        .sizes button { 
          flex: 1; background: #fef3c7; border: 1px solid #fcd34d; 
          border-radius: 6px; padding: 6px 2px; font-size: 10px; 
          line-height: 1.2; cursor: pointer; color: #92400e; font-weight: 600;
        }
        .sizes button:active { background: #fde68a; }
        .stok { text-align: center; font-size: 11px; color: #9ca3af; }

        .cart-fab {
          position: fixed; bottom: 20px; right: 20px;
          width: 56px; height: 56px; border-radius: 50%;
          background: #ea580c; color: white; font-size: 24px;
          border: none; box-shadow: 0 4px 12px rgba(234,88,12,0.4);
          cursor: pointer; z-index: 50;
        }
        .cart-fab span {
          position: absolute; top: -4px; right: -4px;
          background: #dc2626; color: white; border-radius: 50%;
          width: 22px; height: 22px; font-size: 12px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }

        .modal { 
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
          background: rgba(0,0,0,0.5); display: flex; 
          align-items: center; justify-content: center; z-index: 100;
          padding: 16px;
        }
        .modal-content { 
          background: white; border-radius: 16px; padding: 20px; 
          width: 100%; max-width: 400px; max-height: 80vh; overflow-y: auto;
        }
        .modal-content h2 { margin-bottom: 16px; color: #1f2937; }
        .cart-item { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 12px 0; border-bottom: 1px solid #f3f4f6;
        }
        .cart-item p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        .qty { display: flex; align-items: center; gap: 12px; }
        .qty button { 
          width: 28px; height: 28px; border: 1px solid #e5e7eb; 
          background: white; border-radius: 6px; cursor: pointer; font-weight: 600;
        }
        .total { padding: 16px 0; text-align: right; font-size: 18px; }
        .checkout { 
          width: 100%; padding: 14px; background: #ea580c; color: white; 
          border: none; border-radius: 8px; cursor: pointer; font-weight: 700; 
          font-size: 16px; margin-top: 8px;
        }
        .close { 
          width: 100%; padding: 12px; background: #e5e7eb; color: #374151; 
          border: none; border-radius: 8px; cursor: pointer; margin-top: 8px;
          font-weight: 600;
        }
        input, textarea, select { 
          width: 100%; padding: 12px; border: 1px solid #e5e7eb; 
          border-radius: 8px; margin-bottom: 12px; font-family: sans-serif;
        }
        textarea { min-height: 80px; resize: vertical; }
      `}</style>
    </>
  );
}
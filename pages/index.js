import { useState, useEffect } from 'react';
import Head from 'next/head';

const API_URL = 'https://totalfruit-api-production.up.railway.app/products';
const WA_NUMBER = '6285737557859';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedSize, setSelectedSize] = useState('Lite');
  const [loading, setLoading] = useState(true);
  
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [metode, setMetode] = useState('COD');

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    const exist = cart.find(i => i.id === product.id && i.size === selectedSize);
    if (exist) {
      setCart(cart.map(i => 
        i.id === product.id && i.size === selectedSize 
        ? {...i, qty: i.qty + 1} 
        : i
      ));
    } else {
      setCart([...cart, {...product, size: selectedSize, qty: 1}]);
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
    return cart.reduce((sum, i) => sum + i.harga[selectedSize.toLowerCase()] * i.qty, 0);
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
        <title>TotalGo - Jus Buah Segar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="container">
        <header>
          <h1>TotalGo</h1>
          <div className="cart-icon" onClick={() => setShowCart(true)}>
            🛒 {cart.length > 0 && <span>{cart.reduce((a,b) => a + b.qty, 0)}</span>}
          </div>
        </header>

        <div className="sizes">
          {['Lite', 'Healthy', 'Sultan'].map(s => (
            <button 
              key={s} 
              className={selectedSize === s ? 'active' : ''} 
              onClick={() => setSelectedSize(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? <p className="loading">Loading produk...</p> : (
          <div className="grid">
            {products.map(p => (
              <div key={p.id} className="card">
                <img src={p.gambar} alt={p.nama} />
                <h3>{p.nama}</h3>
                <p>Rp{p.harga[selectedSize.toLowerCase()].toLocaleString()}</p>
                <button onClick={() => addToCart(p)}>+ Keranjang</button>
              </div>
            ))}
          </div>
        )}

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

      <style jsx>{`
        .container { max-width: 500px; margin: 0 auto; padding: 16px; font-family: sans-serif; }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        h1 { margin: 0; color: #16a34a; }
        .cart-icon { font-size: 28px; cursor: pointer; position: relative; }
        .cart-icon span { 
          position: absolute; top: -8px; right: -8px; 
          background: #ef4444; color: white; border-radius: 50%; 
          width: 20px; height: 20px; font-size: 12px; 
          display: flex; align-items: center; justify-content: center;
        }
        .sizes { display: flex; gap: 8px; margin-bottom: 20px; }
        .sizes button { 
          flex: 1; padding: 10px; border: 2px solid #e5e7eb; 
          background: white; border-radius: 8px; cursor: pointer; font-weight: 600;
        }
        .sizes button.active { background: #16a34a; color: white; border-color: #16a34a; }
        .loading { text-align: center; padding: 40px; color: #6b7280; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .card { 
          border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; 
          text-align: center; background: white;
        }
        .card img { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
        .card h3 { margin: 8px 0 4px; font-size: 16px; }
        .card p { margin: 4px 0 8px; color: #16a34a; font-weight: 600; }
        .card button { 
          width: 100%; padding: 8px; background: #16a34a; color: white; 
          border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
        }
        .modal { 
          position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
          background: rgba(0,0,0,0.5); display: flex; 
          align-items: center; justify-content: center; z-index: 100;
        }
        .modal-content { 
          background: white; border-radius: 16px; padding: 20px; 
          width: 90%; max-width: 400px; max-height: 80vh; overflow-y: auto;
        }
        .modal-content h2 { margin-top: 0; }
        .cart-item { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 12px 0; border-bottom: 1px solid #e5e7eb;
        }
        .cart-item p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        .qty { display: flex; align-items: center; gap: 12px; }
        .qty button { 
          width: 28px; height: 28px; border: 1px solid #e5e7eb; 
          background: white; border-radius: 6px; cursor: pointer;
        }
        .total { padding: 16px 0; text-align: right; font-size: 18px; }
        .checkout { 
          width: 100%; padding: 14px; background: #16a34a; color: white; 
          border: none; border-radius: 8px; cursor: pointer; font-weight: 600; 
          font-size: 16px; margin-top: 8px;
        }
        .close { 
          width: 100%; padding: 12px; background: #e5e7eb; color: #374151; 
          border: none; border-radius: 8px; cursor: pointer; margin-top: 8px;
        }
        input, textarea, select { 
          width: 100%; padding: 12px; border: 1px solid #e5e7eb; 
          border-radius: 8px; margin-bottom: 12px; font-family: sans-serif; box-sizing: border-box;
        }
        textarea { min-height: 80px; resize: vertical; }
      `}</style>
    </>
  );
}
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const NO_WA_JURAGAN = '6281234567890'; // GANTI NOMOR LU

  useEffect(() => {
    fetch('https://totalfruit-api-production.up.railway.app/api/produk')
    .then(res => res.json())
    .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
    .catch(() => setIsLoading(false));
  }, []);

  const addToCart = (id, size, price) => {
    const key = `${id}-${size}`;
    setCart(prev => ({
    ...prev,
      [key]: {
        id, size, price,
        name: products.find(p => p.id === id).name,
        qty: (prev[key]?.qty || 0) + 1
      }
    }));
  };

  const updateQty = (key, delta) => {
    setCart(prev => {
      const newCart = {...prev };
      if (newCart[key]) {
        newCart[key].qty += delta;
        if (newCart[key].qty <= 0) delete newCart[key];
      }
      return newCart;
    });
  };

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);

  const checkoutWA = () => {
    if (!customerName ||!customerAddress) {
      alert('Isi nama & alamat dulu bro!');
      return;
    }
    if (totalItems === 0) {
      alert('Keranjang masih kosong!');
      return;
    }

    let pesan = `Halo TotalGo! Saya mau pesan:%0A%0A`;
    pesan += `Nama: ${customerName}%0AAlamat: ${customerAddress}%0A%0A*Pesanan:*%0A`;
    Object.values(cart).forEach(item => {
      pesan += `- ${item.name} ${item.size} x${item.qty} = Rp${(item.price * item.qty).toLocaleString('id-ID')}%0A`;
    });
    pesan += `%0A*Total: Rp${totalPrice.toLocaleString('id-ID')}*`;

    window.open(`https://wa.me/${NO_WA_JURAGAN}?text=${pesan}`, '_blank');
  };

  return (
    <>
      <Head>
        <title>TotalGo - Jus Buah Segar</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="app">
        <header>
          <h1>TOTALGO</h1>
          <p>Jus Buah Segar Siap Antar</p>
        </header>

        {isLoading? (
          <div className="loading">Loading produk...</div>
        ) : (
          <div className="grid">
            {products.map(prod => (
              <div key={prod.id} className="card">
                <img src={prod.img} alt={prod.name} />
                <h3>{prod.title}</h3>
                <div className="sizes">
                  <button onClick={() => addToCart(prod.id, 'Lite', prod.harga_lite)}>
                    Lite<br/>Rp{prod.harga_lite.toLocaleString('id-ID')}
                  </button>
                  <button onClick={() => addToCart(prod.id, 'Healthy', prod.harga_healthy)}>
                    Healthy<br/>Rp{prod.harga_healthy.toLocaleString('id-ID')}
                  </button>
                  <button onClick={() => addToCart(prod.id, 'Sultan', prod.harga_sultan)}>
                    Sultan<br/>Rp{prod.harga_sultan.toLocaleString('id-ID')}
                  </button>
                </div>
                <p className="stok">Stok: {prod.stok}</p>
              </div>
            ))}
          </div>
        )}

        <div className={`cart-btn ${showCart? 'hide' : ''}`} onClick={() => setShowCart(true)}>
          🛒 {totalItems > 0 && <span className="badge">{totalItems}</span>}
        </div>

        <div className={`cart-panel ${showCart? 'show' : ''}`}>
          <div className="cart-header">
            <h2>Keranjang</h2>
            <button onClick={() => setShowCart(false)}>✕</button>
          </div>

          {totalItems === 0? (
            <p className="empty">Keranjang kosong</p>
          ) : (
            <>
              <div className="cart-items">
                {Object.entries(cart).map(([key, item]) => (
                  <div key={key} className="cart-item">
                    <div>
                      <b>{item.name} {item.size}</b>
                      <p>Rp{item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="qty-control">
                      <button onClick={() => updateQty(key, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(key, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form">
                <input
                  placeholder="Nama kamu"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
                <textarea
                  placeholder="Alamat lengkap"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                />
              </div>

              <div className="total">
                <b>Total: Rp{totalPrice.toLocaleString('id-ID')}</b>
                <button className="checkout" onClick={checkoutWA}>Checkout via WA</button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { background: #fffbf0; }
      .app { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { text-align: center; margin-bottom: 30px; }
        header h1 { font-size: 2.5rem; color: #e85d04; font-weight: 700; }
        header p { color: #666; }
      .loading { text-align: center; padding: 50px; font-size: 1.2rem; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
      .card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-align: center; }
      .card img { width: 100%; height: 180px; object-fit: contain; margin-bottom: 12px; }
      .card h3 { margin-bottom: 15px; color: #333; font-size: 1.1rem; }
      .sizes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
      .sizes button { background: #fff4e6; border: 2px solid #ffd6a5; border-radius: 8px; padding: 8px 4px; font-size: 0.8rem; cursor: pointer; font-weight: 600; }
      .sizes button:hover { background: #e85d04; color: white; border-color: #e85d04; }
      .stok { font-size: 0.85rem; color: #888; }
      .cart-btn { position: fixed; bottom: 20px; right: 20px; background: #e85d04; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; cursor: pointer; box-shadow: 0 4px 12px rgba(232,93,4,0.4); z-index: 99; }
      .cart-btn.hide { display: none; }
      .badge { position: absolute; top: -5px; right: -5px; background: #d00000; color: white; width: 24px; height: 24px; border-radius: 50%; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; font-weight: 700; }
      .cart-panel { position: fixed; top: 0; right: -400px; width: 100%; max-width: 400px; height: 100%; background: white; box-shadow: -4px 0 12px rgba(0,0,0,0.1); transition: 0.3s; z-index: 100; display: flex; flex-direction: column; }
      .cart-panel.show { right: 0; }
      .cart-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
      .cart-header button { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
      .empty { text-align: center; padding: 50px 20px; color: #888; }
      .cart-items { flex: 1; overflow-y: auto; padding: 0 20px; }
      .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #f0f0f0; }
      .cart-item p { color: #666; font-size: 0.9rem; }
      .qty-control { display: flex; align-items: center; gap: 12px; }
      .qty-control button { width: 28px; height: 28px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: 700; }
      .form { padding: 20px; border-top: 1px solid #eee; }
      .form input,.form textarea { width: 100%; padding: 12px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
      .form textarea { resize: none; height: 80px; }
      .total { padding: 20px; border-top: 1px solid #eee; }
      .total b { display: block; font-size: 1.2rem; margin-bottom: 12px; }
      .checkout { width: 100%; background: #25D366; color: white; border: none; padding: 15px; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; }
      .checkout:hover { background: #1fa855; }
        @media (max-width: 768px) {.grid { grid-template-columns: 1fr 1fr; }.card img { height: 140px; } }
      `}</style>
    </>
  );
}
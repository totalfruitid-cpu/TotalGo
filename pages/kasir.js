import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";

// UDAH GUE ISIIN CONFIG LU
const firebaseConfig = {
  apiKey: "AIzaSyCcy623MutRjfqkNl4a-XJVJkhDuy-orFs",
  authDomain: "totalgo-3c5d7.firebaseapp.com",
  projectId: "totalgo-3c5d7",
  storageBucket: "totalgo-3c5d7.firebasestorage.app",
  messagingSenderId: "134463276576",
  appId: "1:134463276576:web:8bce0edf6fbdbf040d1e45"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showStruk, setShowStruk] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [namaCustomer, setNamaCustomer] = useState('');
  const [waCustomer, setWaCustomer] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
      setProducts(data);
    });
    return () => unsub();
  }, []);

  const addToCart = (product, size) => {
    const fieldStok = size === 'Lite'? 'stok_lite' : size === 'Healthy'? 'stok_healthy' : 'stok_sultan';
    if (product[fieldStok] <= 0) return alert('Stok habis bro');

    setCart(prev => {
      const exist = prev.find(i => i.id === product.id && i.size === size);
      if (exist) {
        return prev.map(i => i.id === product.id && i.size === size? {...i, qty: i.qty + 1 } : i);
      }
      const harga = size === 'Lite'? product.harga_lite : size === 'Healthy'? product.harga_healthy : product.harga_sultan;
      return [...prev, {...product, size, qty: 1, price: harga }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang kosong bro');
    if (!namaCustomer ||!waCustomer) return alert('Isi nama & No. WA dulu bro');

    try {
      for (const item of cart) {
        const productRef = doc(db, 'products', item.id);
        const field = item.size === 'Lite'? 'stok_lite' : item.size === 'Healthy'? 'stok_healthy' : 'stok_sultan';
        await updateDoc(productRef, { [field]: increment(-item.qty) });
      }

      const totalHarga = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      const orderData = {
        items: cart,
        total: totalHarga,
        status: 'baru',
        createdAt: serverTimestamp(),
        nomorOrder: `#TF${Date.now().toString().slice(-6)}`,
        nama: namaCustomer,
        no_wa: waCustomer
      };
      await addDoc(collection(db, "orders"), orderData);

      setLastOrder(orderData);
      setShowStruk(true);
      setCart([]);
      setNamaCustomer('');
      setWaCustomer('');

    } catch (error) {
      console.error("Gagal CO:", error);
      alert('Gagal proses pesanan: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>TotalGo Customer</h1>

      <h2>Menu</h2>
      {products.map(p => (
        <div key={p.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <h3>{p.name}</h3>
          {p.punya_varian && (
            <>
              <button onClick={() => addToCart(p, 'Lite')}>Lite: {p.harga_lite} | Stok: {p.stok_lite}</button>
              <button onClick={() => addToCart(p, 'Healthy')}>Healthy: {p.harga_healthy} | Stok: {p.stok_healthy}</button>
              <button onClick={() => addToCart(p, 'Sultan')}>Sultan: {p.harga_sultan} | Stok: {p.stok_sultan}</button>
            </>
          )}
        </div>
      ))}

      <h2>Keranjang</h2>
      {cart.map((item, i) => (
        <div key={i}>{item.name} {item.size} x {item.qty} = Rp{(item.price * item.qty).toLocaleString()}</div>
      ))}
      <h3>Total: Rp{cart.reduce((sum, i) => sum + i.price * i.qty, 0).toLocaleString()}</h3>

      <h2>Data Pemesan</h2>
      <input
        type="text"
        placeholder="Nama Kamu"
        value={namaCustomer}
        onChange={(e) => setNamaCustomer(e.target.value)}
        style={{width: '100%', padding: '8px', marginBottom: '8px'}}
      />
      <input
        type="tel"
        placeholder="No. WhatsApp: 0812xxxx"
        value={waCustomer}
        onChange={(e) => setWaCustomer(e.target.value)}
        style={{width: '100%', padding: '8px', marginBottom: '8px'}}
      />

      <button onClick={handleCheckout} style={{ width: '100%', padding: '12px', background: 'green', color: 'white', border: 'none', borderRadius: '8px' }}>
        Checkout Sekarang
      </button>

      {showStruk && lastOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 999
        }}>
          <div style={{
            background: 'white', padding: '20px', borderRadius: '12px',
            width: '90%', maxWidth: '350px', color: 'black', fontFamily: 'monospace'
          }}>
            <h3 style={{ textAlign: 'center', margin: 0 }}>TOTAL FRUIT</h3>
            <p style={{ textAlign: 'center', margin: '4px 0 12px 0' }}>{lastOrder.nomorOrder}</p>
            <p style={{ textAlign: 'center', margin: '4px 0 12px 0' }}>Atas nama: {lastOrder.nama}</p>
            <hr style={{ borderTop: '1px dashed #000' }} />
            {lastOrder.items.map((item, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div>{item.name} {item.size}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.qty} x {item.price.toLocaleString()}</span>
                  <span>{(item.qty * item.price).toLocaleString()}</span>
                </div>
              </div>
            ))}
            <hr style={{ borderTop: '1px dashed #000' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>TOTAL</span>
              <span>Rp{lastOrder.total.toLocaleString()}</span>
            </div>
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
              Tunjukkan struk ini ke kasir ya kak. Admin akan hubungi via WA 🙏
            </p>
            <button
              onClick={() => setShowStruk(false)}
              style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
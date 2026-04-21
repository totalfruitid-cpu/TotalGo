import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, addDoc } from "firebase/firestore"

export default function Store() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [table, setTable] = useState("")
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"))
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  const getPrice = (p, v) => {
    if (v === "lite") return p.harga_lite
    if (v === "healthy") return p.harga_healthy
    if (v === "sultan") return p.harga_sultan
  }

  const addToCart = (p, variant) => {
    const price = getPrice(p, variant)

    setCart(prev => {
      const exist = prev.find(i => i.id === p.id && i.variant === variant)

      if (exist) {
        return prev.map(i =>
          i.id === p.id && i.variant === variant
            ? { ...i, qty: i.qty + 1 }
            : i
        )
      }

      return [...prev, {
        id: p.id,
        nama: p.nama,
        variant,
        harga: price,
        qty: 1
      }]
    })
  }

  const checkout = async () => {
    if (!table) return alert("Isi meja")
    if (cart.length === 0) return alert("Cart kosong")

    try {
      setCheckingOut(true)

      const total = cart.reduce((a, b) => a + b.harga * b.qty, 0)

      await addDoc(collection(db, "orders"), {
        meja: table,
        items: cart,
        total,
        status: "pending",
        createdAt: Date.now()
      })

      setCart([])
      setTable("")
      alert("Order masuk!")
    } catch (err) {
      alert("Gagal checkout")
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) return <div style={{color:"#fff"}}>Loading...</div>

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <img src="/logo.png" style={styles.logo}/>
        <input
          placeholder="No Meja"
          value={table}
          onChange={(e)=>setTable(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* PRODUCTS */}
      <div style={styles.grid}>
        {products.map(p => (
          <div key={p.id} style={styles.card}>

            <img src={`/menu/${p.image || "menu-avocado.png"}`} style={styles.image}/>

            <h3>{p.nama}</h3>

            <div style={styles.variantWrap}>
              <button onClick={()=>addToCart(p,"lite")} style={styles.variant}>
                Lite<br/>18K
              </button>
              <button onClick={()=>addToCart(p,"healthy")} style={styles.variant}>
                Healthy<br/>25K
              </button>
              <button onClick={()=>addToCart(p,"sultan")} style={styles.variant}>
                Sultan<br/>45K
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* CART */}
      <div style={styles.cart}>
        <h3>Cart</h3>

        {cart.map((c,i)=>(
          <div key={i} style={styles.cartItem}>
            {c.qty}x {c.nama} ({c.variant})
          </div>
        ))}

        <h3>
          Rp {cart.reduce((a,b)=>a+b.harga*b.qty,0).toLocaleString()}
        </h3>

        <button onClick={checkout} style={styles.checkout}>
          {checkingOut ? "Processing..." : "Checkout"}
        </button>
      </div>

    </div>
  )
}

/* ================= STYLE ================= */

const styles = {
  page:{
    background:"#0f172a",
    minHeight:"100vh",
    padding:16,
    color:"#fff",
    fontFamily:"sans-serif"
  },

  header:{
    display:"flex",
    gap:10,
    marginBottom:16
  },

  logo:{
    width:50,
    height:50
  },

  input:{
    flex:1,
    padding:10,
    borderRadius:10,
    border:"none"
  },

  grid:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr",
    gap:12
  },

  card:{
    background:"#1e293b",
    padding:12,
    borderRadius:12,
    textAlign:"center"
  },

  image:{
    width:"100%",
    borderRadius:10,
    marginBottom:8
  },

  variantWrap:{
    display:"grid",
    gridTemplateColumns:"1fr 1fr 1fr",
    gap:5
  },

  variant:{
    background:"#22c55e",
    border:"none",
    padding:6,
    borderRadius:8,
    fontSize:12,
    cursor:"pointer"
  },

  cart:{
    marginTop:20,
    background:"#111827",
    padding:12,
    borderRadius:12
  },

  cartItem:{
    fontSize:13,
    opacity:0.8
  },

  checkout:{
    width:"100%",
    padding:12,
    marginTop:10,
    background:"#facc15",
    border:"none",
    borderRadius:10,
    fontWeight:"bold"
  }
}
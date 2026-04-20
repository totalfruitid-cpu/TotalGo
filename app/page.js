"use client"
import { useState } from "react"
import { db } from "../lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

export default function Home() {
  // 1. DAFTAR MENU: ada gambar, stok, harga, varian
  const daftarMenu = [
    { 
      id: 1, 
      nama: "Kopi Susu", 
      harga: 18000, 
      stok: 20,
      gambar: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400",
      varian: ["Hot", "Ice"] 
    },
    { 
      id: 2, 
      nama: "Nasi Goreng Sultan", 
      harga: 35000, 
      stok: 15,
      gambar: "https://images.unsplash.com/photo-1512058564366-18510beccaec?w=400",
      varian: ["Pedas", "Ori"] 
    },
    { 
      id: 3, 
      nama: "Roti Bakar", 
      harga: 15000, 
      stok: 0, // contoh stok habis
      gambar: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400",
      varian: ["Coklat", "Keju"] 
    },
  ]

  const [cart, setCart] = useState([])
  const [namaCustomer, setNamaCustomer] = useState("")
  const [noMeja, setNoMeja] = useState("")
  const [loading, setLoading] = useState(false)

  // 2. TAMBAH KE CART + CEK STOK
  const tambahKeCart = (menu, varian) => {
    if (menu.stok === 0) return alert("Stok habis bos!")
    
    const existing = cart.find(item => item.id === menu.id && item.varianDipilih === varian)
    const qtyDiCart = existing ? existing.qty : 0
    
    if (qtyDiCart >= menu.stok) return alert(`Stok ${menu.nama} cuma ${menu.stok}`)

    if (existing) {
      setCart(cart.map(item => 
        item.id === menu.id && item.varianDipilih === varian 
        ? { ...item, qty: item.qty + 1 } 
        : item
      ))
    } else {
      setCart([...cart, { ...menu, qty: 1, varianDipilih: varian }])
    }
  }

  const kurangQty = (id, varian) => {
    setCart(cart.map(item => {
      if (item.id === id && item.varianDipilih === varian) {
        return { ...item, qty: item.qty - 1 }
      }
      return item
    }).filter(item => item.qty > 0))
  }

  const tambahQty = (id, varian) => {
    const menuAsli = daftarMenu.find(m => m.id === id)
    const itemDiCart = cart.find(item => item.id === id && item.varianDipilih === varian)
    
    if (itemDiCart.qty >= menuAsli.stok) return alert(`Stok mentok di ${menuAsli.stok}`)
    
    setCart(cart.map(item => 
      item.id === id && item.varianDipilih === varian 
      ? { ...item, qty: item.qty + 1 } 
      : item
    ))
  }

  const totalHarga = cart.reduce((total, item) => total + (item.harga * item.qty), 0)

  const prosesPesanan = async () => {
    if (cart.length === 0) return alert("Keranjang masih kosong bos")
    if (!namaCustomer) return alert("Nama customer wajib diisi")
    if (!noMeja) return alert("Nomor meja wajib diisi")
    
    setLoading(true)
    try {
      const noAntrian = "TG-" + Date.now().toString().slice(-4)
      await addDoc(collection(db, "pesanan"), {
        noAntrian, namaCustomer, noMeja, items: cart, totalHarga,
        status: "Baru", waktu: serverTimestamp()
      })
      alert(`Sukses! Nomor Antrian: ${noAntrian}`)
      setCart([]); setNamaCustomer(""); setNoMeja("")
    } catch (err) {
      alert("Gagal: " + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* KIRI: DAFTAR MENU */}
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold mb-4 text-[#FFD700]">Pilih Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {daftarMenu.map(menu => (
            <div key={menu.id} className="bg-[#1a1a1a] border border-[#FFD700]/20 rounded-lg overflow-hidden">
              {/* GAMBAR */}
              <img src={menu.gambar} alt={menu.nama} className="w-full h-40 object-cover" />
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white">{menu.nama}</h3>
                  {/* STOK */}
                  <span className={`text-xs px-2 py-1 rounded ${menu.stok > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    Stok: {menu.stok}
                  </span>
                </div>
                <p className="text-[#FFD700] font-semibold mb-3">Rp{menu.harga.toLocaleString()}</p>
                
                {/* VARIAN */}
                <div className="flex gap-2 flex-wrap">
                  {menu.varian.map(v => (
                    <button 
                      key={v}
                      onClick={() => tambahKeCart(menu, v)}
                      disabled={menu.stok === 0}
                      className="bg-black border border-[#FFD700]/50 text-[#FFD700] px-3 py-1 rounded text-sm hover:bg-[#FFD700] hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      + {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KANAN: KERANJANG */}
      <div className="bg-[#1a1a1a] border border-[#FFD700]/20 rounded-lg p-6 h-fit">
        <h2 className="text-2xl font-bold mb-4 text-[#FFD700]">Daftar Pesanan</h2>
        <input type="text" placeholder="Nama Customer" value={namaCustomer} onChange={(e) => setNamaCustomer(e.target.value)} className="w-full bg-black border border-[#FFD700]/30 rounded px-3 py-2 mb-3 text-white placeholder:text-gray-500" />
        <input type="text" placeholder="No. Meja" value={noMeja} onChange={(e) => setNoMeja(e.target.value)} className="w-full bg-black border border-[#FFD700]/30 rounded px-3 py-2 mb-4 text-white placeholder:text-gray-500" />

        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
          ) : cart.map(item => (
            <div key={`${item.id}-${item.varianDipilih}`} className="flex justify-between items-center text-sm">
              <div>
                <p className="text-white font-semibold">{item.nama}</p>
                <p className="text-[#FFD700]/70">{item.varianDipilih} - Rp{item.harga.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => kurangQty(item.id, item.varianDipilih)} className="bg-black border border-[#FFD700] w-6 h-6 rounded text-[#FFD700]">-</button>
                <span className="text-white w-4 text-center">{item.qty}</span>
                <button onClick={() => tambahQty(item.id, item.varianDipilih)} className="bg-black border border-[#FFD700] w-6 h-6 rounded text-[#FFD700]">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#FFD700]/20 pt-4">
          <div className="flex justify-between text-xl font-bold mb-4">
            <span className="text-white">TOTAL</span>
            <span className="text-[#FFD700]">Rp{totalHarga.toLocaleString()}</span>
          </div>
          <button onClick={prosesPesanan} disabled={loading || cart.length === 0} className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-lg text-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading ? "MEMPROSES..." : "PROSES PESANAN"}
          </button>
        </div>
      </div>
    </div>
  )
}
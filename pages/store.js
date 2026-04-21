const checkout = async () => {
  try {
    if (!table || table.trim() === "") {
      alert("Meja wajib diisi")
      return
    }

    if (!cart || cart.length === 0) {
      alert("Cart kosong")
      return
    }

    setCheckingOut(true)

    const total = cart.reduce((a, b) => {
      const harga = Number(b.harga || 0)
      const qty = Number(b.qty || 1)
      return a + harga * qty
    }, 0)

    const payload = {
      meja: table.trim(),
      items: cart.map(item => ({
        nama: item.nama,
        variant: item.variant || "lite",
        qty: Number(item.qty || 1),
        harga: Number(item.harga || 0)
      })),
      total,
      status: "pending",
      createdAt: new Date()
    }

    console.log("CHECKOUT PAYLOAD:", payload)

    await addDoc(collection(db, "orders"), payload)

    setCart([])
    setTable("")

    alert("Order berhasil dikirim")
  } catch (err) {
    console.error("CHECKOUT ERROR:", err)
    alert("Checkout gagal: " + err.message)
  } finally {
    setCheckingOut(false)
  }
}
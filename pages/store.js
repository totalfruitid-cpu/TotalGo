const checkout = async () => {
  try {
    if (!table || table.trim() === "") {
      alert("Isi nomor meja")
      return
    }

    if (!cart || cart.length === 0) {
      alert("Cart kosong")
      return
    }

    setCheckingOut(true)

    // 🔥 FIX: pastikan semua data VALID
    const safeItems = cart.map(item => ({
      nama: item.nama ? String(item.nama) : "Unknown",
      variant: item.variant ? String(item.variant) : "lite",
      qty: item.qty ? Number(item.qty) : 1,
      harga: item.harga ? Number(item.harga) : 0,
    }))

    const total = safeItems.reduce((a, b) => a + b.harga * b.qty, 0)

    await addDoc(collection(db, "orders"), {
      meja: String(table),
      items: safeItems,
      total: Number(total),
      status: "pending",
      createdAt: Date.now()
    })

    setCart([])
    setTable("")
    alert("Order berhasil")

  } catch (err) {
    console.error("ERROR:", err)
    alert("Checkout gagal: " + err.message)
  } finally {
    set
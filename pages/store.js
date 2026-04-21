const checkout = async () => {
  console.log("CLICK CHECKOUT")

  if (!table || table.trim() === "") {
    alert("Meja wajib diisi")
    return
  }

  if (!cart || cart.length === 0) {
    alert("Cart kosong")
    return
  }

  try {
    setCheckingOut(true)

    const total = cart.reduce((sum, item) => {
      return sum + (Number(item.harga || 0) * Number(item.qty || 1))
    }, 0)

    const payload = {
      meja: String(table),
      items: cart.map(item => ({
        nama: String(item.nama || ""),
        variant: String(item.variant || "lite"),
        qty: Number(item.qty || 1),
        harga: Number(item.harga || 0)
      })),
      total: Number(total),
      status: "pending",
      createdAt: Date.now() // 🔥 GANTI INI (ANTI ERROR SSR)
    }

    const ref = collection(db, "orders")

    await addDoc(ref, payload)

    setCart([])
    setTable("")

    alert("Order berhasil")
  } catch (err) {
    console.error("CHECKOUT ERROR:", err)
    alert("Checkout gagal: " + err.message)
  } finally {
    setCheckingOut(false)
  }
}
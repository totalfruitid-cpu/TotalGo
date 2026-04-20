const handleCheckout = async () => {
  if (cart.length === 0) return alert("Keranjang kosong")
  if (!namaCustomer.trim()) return alert("Isi nama customer dulu")
  if (!noMeja.trim()) return alert("Isi nomor meja dulu")

  setLoading(true)
  try {
    const orderRef = doc(collection(db, "orders"))
    const queueRef = doc(db, "meta", "queue")
    const total = cart.reduce((sum, item) => sum + item.harga * item.qty, 0)

    const noAntrian = await runTransaction(db, async (tx) => {
      const snap = await tx.get(queueRef)
      const today = new Date().toISOString().split("T")[0] // Format: 2026-04-20

      if (!snap.exists()) {
        // PERTAMA KALI / DOC BELUM ADA -> PAKE SET
        tx.set(queueRef, { date: today, last_number: 1 })
        return 1
      } else {
        const data = snap.data()
        if (data.date === today) {
          // HARI YANG SAMA -> UPDATE +1
          const newNum = data.last_number + 1
          tx.update(queueRef, { last_number: newNum })
          return newNum
        } else {
          // GANTI HARI -> RESET PAKE SET
          tx.set(queueRef, { date: today, last_number: 1 })
          return 1
        }
      }
    })

    // Bikin order
    await setDoc(orderRef, {
      items: cart.map(item => ({
        id: item.id,
        nama: item.nama,
        harga: item.harga,
        qty: item.qty,
        variant: item.variant || null
      })),
      total,
      created_at: serverTimestamp(),
      nomor_antrian: noAntrian,
      status: "pending",
      no_meja: noMeja,
      nama_customer: namaCustomer
    })

    alert(`Order sukses! Nomor antrian: ${noAntrian}`)
    setCart([])
    setNamaCustomer("")
    setNoMeja("")

  } catch (err) {
    console.error("FIREBASE ERROR:", err)
    alert("Gagal order: " + err.code + "\n" + err.message)
  } finally {
    setLoading(false)
  }
}
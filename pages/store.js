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

    // 🔥 FORMAT ITEMS SESUAI RULES
    const items = cart.map(item => ({
      nama: String(item.nama || ""),
      variant: String(item.variant || "lite"),
      qty: Number(item.qty || 1),
      harga: Number(item.harga || 0)
    }))

    const total = items.reduce((a, b) => a + b.harga * b.qty, 0)

    // 🔥 AMBIL NOMOR ANTRIAN (WAJIB SESUAI RULES)
    const today = new Date().toISOString().split("T")[0]

    const queueRef = doc(db, "meta", "queue")
    const queueSnap = await getDoc(queueRef)

    let nomor_antrian = 1

    if (!queueSnap.exists()) {
      // buat baru
      await setDoc(queueRef, {
        date: today,
        last_number: 1
      })
      nomor_antrian = 1
    } else {
      const data = queueSnap.data()

      if (data.date === today) {
        nomor_antrian = data.last_number + 1

        await updateDoc(queueRef, {
          last_number: nomor_antrian
        })
      } else {
        // reset hari baru
        nomor_antrian = 1

        await updateDoc(queueRef, {
          date: today,
          last_number: 1
        })
      }
    }

    // 🔥 PAYLOAD SESUAI RULES
    const payload = {
      items,
      total: Number(total),
      created_at: Date.now(),
      nomor_antrian: Number(nomor_antrian),
      status: "pending",
      no_meja: String(table),
      nama_customer: "Guest"
    }

    console.log("ORDER FIX:", payload)

    await addDoc(collection(db, "orders"), payload)

    setCart([])
    setTable("")

    alert(`Order masuk! No Antrian: ${nomor_antrian}`)

  } catch (err) {
    console.error("ERROR:", err)
    alert("Checkout gagal: " + err.message)
  } finally {
    setCheckingOut(false)
  }
}
const handleBayar = async () => {
  if (loading) return

  // 🔥 VALIDASI CEPAT DI UI
  if (!namaCustomer.trim()) {
    alert("Nama wajib diisi")
    return
  }

  if (metodeBayar === "COD") {
    if (!alamat.trim() || !noHp.trim()) {
      alert("COD wajib isi alamat & no HP")
      return
    }
  }

  setLoading(true)

  try {
    const res = await checkout(
      cart,
      meja,
      namaCustomer,
      metodeBayar,
      alamat,
      noHp
    )

    if (!res.success) {
      alert(res.message)
      return
    }

    // ✅ RESET STATE
    setCart([])
    setNamaCustomer("")
    setAlamat("")
    setNoHp("")

    const nomor = String(res.nomor_antrian).padStart(3, "0")
    router.push(`/sukses?nomor=${nomor}`)

  } catch (err) {
    // 🔥 HANDLE ERROR TAK TERDUGA
    console.error(err)
    alert("Terjadi kesalahan. Coba lagi.")
  } finally {
    setLoading(false)
  }
}
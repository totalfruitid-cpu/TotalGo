const buildPayload = () => {
  const base = {
    nama: form.nama,
    punya_varian: form.punya_varian,
    deskripsi: form.deskripsi,
    gambar_url: form.gambar_url
  }

  if (form.punya_varian) {
    return {
      ...base,
      harga_lite: Number(form.harga_lite),
      harga_healthy: Number(form.harga_healthy),
      harga_sultan: Number(form.harga_sultan)
    }
  }

  return {
    ...base,
    harga_lite: Number(form.harga_lite)
  }
}
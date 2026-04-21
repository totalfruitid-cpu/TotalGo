import { doc, runTransaction, collection, Timestamp } from "firebase/firestore"
import { db } from "./firebase"

const getToday = () => {
  return Timestamp.now().toDate().toISOString().split("T")[0]
}

export const checkout = async (cart, table, nama, metode, alamat, no_hp) => {
  try {
    if (!Array.isArray(cart) || cart.length === 0) {
      throw new Error("Cart kosong")
    }
    if (!nama ||!nama.trim()) {
      throw new Error("Nama wajib diisi")
    }
    if (metode === "COD" && (!alamat ||!no_hp)) {
      throw new Error("COD wajib isi alamat & no HP")
    }

    const items = cart.map(i => ({
      nama: String(i.nama || ""),
      variant: String(i.variant || "-"),
      qty: Number(i.qty || 1),
      harga: Number(i.harga || 0)
    }))

    const total = items.reduce((a, b) => a + b.qty * b.harga, 0)
    if (total <= 0) throw new Error("Total tidak valid")

    let nomor_antrian = 0

    await runTransaction(db, async (transaction) => {
      const queueRef = doc(db, "meta", "queue")
      const snap = await transaction.get(queueRef)
      const today = getToday()

      if (!snap.exists()) {
        nomor_antrian = 1
        transaction.set(queueRef, { date: today, last_number: 1 })
      } else {
        const data = snap.data()
        if (data.date === today) {
          nomor_antrian = data.last_number + 1
          transaction.update(queueRef, { last_number: nomor_antrian })
        } else {
          nomor_antrian = 1
          transaction.set(queueRef, { date: today, last_number: 1 })
        }
      }

      const orderRef = doc(collection(db, "orders"))
      transaction.set(orderRef, {
        items,
        total,
        status: "pending",
        nomor_antrian,
        nama_customer: nama,
        metode_pembayaran: metode,
        no_meja: table || "-",
        alamat: metode === "COD"? alamat : null,
        no_hp: metode === "COD"? no_hp : null,
        created_at: Timestamp.now()
      })
    })

    return {
      success: true,
      nomor_antrian,
      message: "Order berhasil"
    }

  } catch (err) {
    console.error("CHECKOUT ERROR:", err)
    return {
      success: false,
      message: err.message || "Terjadi kesalahan"
    }
  }
}
import { useRouter } from "next/router"
import { useMemo, useEffect } from "react"
import Link from "next/link"

export default function Sukses() {
  const router = useRouter()
  const { nomor } = router.query

  // 🔥 Auto redirect kalo dibuka tanpa nomor
  useEffect(() => {
    if (router.isReady &&!nomor) {
      router.replace("/store")
    }
  }, [router.isReady, nomor])

  // 🔥 Derive langsung, gak pake state
  const nomorAntrian = useMemo(() => {
    if (!nomor) return "..."
    return nomor
  }, [nomor])

  // Jangan render apa2 kalo lagi redirect
  if (router.isReady &&!nomor) return null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">

        {/* Icon Centang */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Order Berhasil!</h1>
        <p className="text-gray-600 mb-6">
          Pesanan kamu udah masuk ke kasir
        </p>

        {/* Nomor Antrian */}
        <div className="bg-black text-white rounded-lg p-6 mb-6">
          <p className="text-sm opacity-70 mb-1">Nomor Antrian Kamu</p>
          <p className="text-6xl font-bold tracking-widest">
            {nomorAntrian}
          </p>
        </div>

        {/* Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6 text-left">
          <p className="text-sm font-semibold mb-1">📌 Penting:</p>
          <p className="text-sm text-gray-700">
            Tunjukin nomor ini ke kasir ya. Pantengin layar antrian buat dipanggil.
          </p>
        </div>

        {/* Button */}
        <Link href="/store">
          <button className="w-full bg-black text-white p-3 rounded font-semibold">
            Pesan Lagi
          </button>
        </Link>

        <p className="text-xs text-gray-400 mt-4">
          Screenshot halaman ini biar gak lupa nomornya
        </p>
      </div>
    </div>
  )
}
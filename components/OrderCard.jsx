export default function OrderCard({ order, role, onTerima, onSelesai }) {
  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800', 
    done: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const statusText = {
    pending: 'Baru',
    processing: 'Diproses',
    done: 'Selesai',
    cancelled: 'Dibatalkan'
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-4">
      <div className="bg-[#F97316] p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">
            #{order.id?.slice(-6).toUpperCase()}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[order.status]}`}>
            {statusText[order.status] || order.status}
          </span>
        </div>
        <p className="text-orange-100 text-sm mt-1">
          {order.waktu?.toDate?.()?.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          }) || 'Baru saja'}
        </p>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <p className="font-semibold text-gray-800">{order.nama}</p>
          <p className="text-sm text-gray-500">{order.noHp}</p>
          <p className="text-sm text-gray-600 mt-1">{order.alamat}</p>
          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
            {order.metode}
          </span>
        </div>

        <div className="border-t border-b border-gray-100 py-3 mb-3">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{item.qty}x {item.name}</span>
              <span className="text-gray-900 font-medium">
                Rp{(item.price * item.qty).toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Total Bayar</p>
            <p className="font-bold text-lg text-[#F97316]">
              Rp{order.grandTotal?.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex gap-2">
            {role === 'admin' && order.status === 'pending' && (
              <button
                onClick={() => onTerima(order.id)}
                className="px-5 py-2 bg-[#F97316] text-white rounded-xl font-semibold hover:bg-orange-600 active:scale-95 transition"
              >
                Terima
              </button>
            )}

            {role === 'admin' && order.status === 'processing' && (
              <button
                onClick={() => onSelesai(order.id)}
                className="px-5 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:scale-95 transition"
              >
                Selesai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

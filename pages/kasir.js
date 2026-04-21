<ul>
  {order.items?.map((item, i) => (
    <li key={i}>
      {item.qty}x {item.nama} ({item.variant})
      {" - Rp"}
      {item.harga.toLocaleString("id-ID")}
    </li>
  ))}
</ul>
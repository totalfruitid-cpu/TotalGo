const styles = {
  page: {
    background: "linear-gradient(135deg, #fef7ff, #f0f9ff 50%, #ecfdf5)", // Pastel ungu-biru-ijo
    color: "#1e293b",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    WebkitFontSmoothing: "antialiased"
  },

  container: {
    width: "100%",
    maxWidth: 500,
    margin: "0 auto",
    padding: 16,
    boxSizing: "border-box"
  },

  loading: {
    padding: 20,
    textAlign: "center",
    color: "#475569",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #fef7ff, #f0f9ff)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    padding: "12px 16px",
    borderRadius: 20,
    boxShadow: "0 4px 20px rgba(203, 213, 225, 0.25)",
    border: "1px solid rgba(255,255,255,1)",
    marginBottom: 16
  },

  h1: {
    fontSize: 20,
    margin: 0,
    color: "#0f172a",
    fontWeight: 700
  },

  email: {
    fontSize: 11,
    opacity: 0.7,
    margin: "2px 0 0 0",
    color: "#64748b"
  },

  btnGroup: {
    display: "flex",
    gap: 8,
    marginBottom: 16
  },

  btnPrimary: { // Tombol aktif - Ijo Pastel
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #86efac, #4ade80)",
    color: "#14532d",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 4px 14px rgba(74, 222, 128, 0.35)",
    transition: "all 0.2s ease"
  },

  btnSecondary: { // Tombol non-aktif - Biru Pastel
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #bae6fd, #7dd3fc)",
    color: "#0c4a6e",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s ease"
  },

  btnLogout: { // Tombol logout - Pink Pastel
    padding: "8px 14px",
    background: "linear-gradient(135deg, #fbcfe8, #f9a8d4)",
    color: "#831843",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    boxShadow: "0 4px 14px rgba(249, 168, 212, 0.35)"
  },

  orderList: { display: 'flex', flexDirection: 'column', gap: 12 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 40, fontSize: 14, color: '#64748b' },

  card: { // Card - Putih bersih biar kontras
    background: "#ffffff",
    padding: 16,
    borderRadius: 20,
    boxShadow: "0 4px 16px rgba(203, 213, 225, 0.25)",
    border: "1px solid #f8fafc"
  },

  orderHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 16, alignItems: 'center' },
  badge: { fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize' }, // Badge kuning pastel
  total: { margin: '4px 0 12px 0', fontSize: 18, fontWeight: 700, color: "#0f172a" },
  itemList: { margin: 0, paddingLeft: 18, marginBottom: 12, opacity: 0.8, fontSize: 13, color: '#334155' },

  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 12,
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    outline: "none",
    background: "#f8fafc",
    fontSize: 14,
    boxSizing: "border-box"
  },

  checkboxLabel: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
    color: "#475569",
    fontSize: 14
  }
}
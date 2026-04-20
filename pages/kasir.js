const styles = {
  page: {
    background: "linear-gradient(135deg, #f0f9ff, #fdf2f8)",
    minHeight: "100vh",
    color: "#0f172a",
    fontFamily: "sans-serif"
  },

  container: {
    width: "100%",
    margin: 0,
    padding: 16,
    boxSizing: "border-box"
  },

  loading: {
    padding: 20,
    textAlign: "center",
    color: "#475569"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,0.8)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
  },

  h1: {
    fontSize: 22,
    margin: 0,
    color: "#0f172a",
    fontWeight: "700"
  },

  email: {
    fontSize: 12,
    opacity: 0.7,
    margin: 0,
    color: "#475569"
  },

  card: {
    background: "#ffffff",
    padding: 16,
    borderRadius: 18,
    marginTop: 16,
    boxShadow: "0 15px 35px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0"
  },

  input: {
    width: "100%",
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    outline: "none",
    background: "#f8fafc",
    transition: "0.2s"
  },

  checkboxLabel: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
    alignItems: "center",
    color: "#334155"
  },

  btnGroup: {
    display: "flex",
    gap: 10
  },

  btnPrimary: {
    flex: 1,
    padding: 12,
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 10px 20px rgba(34,197,94,0.25)"
  },

  btnSecondary: {
    flex: 1,
    padding: 12,
    background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
    color: "#fff",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 10px 20px rgba(59,130,246,0.25)"
  },

  btnLogout: {
    padding: "10px 14px",
    background: "linear-gradient(135deg, #f43f5e, #e11d48)",
    color: "#fff",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 10px 25px rgba(225,29,72,0.25)"
  }
}
const styles = {
  page: {
    background: "linear-gradient(135deg, #f8fafc, #e0f2fe)",
    color: "#0f172a",
    minHeight: "100vh",
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
    color: "#334155"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(10px)",
    padding: 12,
    borderRadius: 12,
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)"
  },

  h1: {
    fontSize: 22,
    margin: 0,
    color: "#0f172a"
  },

  email: {
    fontSize: 12,
    opacity: 0.7,
    margin: 0,
    color: "#334155"
  },

  card: {
    background: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0"
  },

  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    outline: "none",
    background: "#f8fafc"
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
    padding: 10,
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: "600"
  },

  btnSecondary: {
    flex: 1,
    padding: 10,
    background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
    color: "#fff",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: "600"
  },

  btnLogout: {
    padding: "8px 14px",
    background: "linear-gradient(135deg, #f43f5e, #e11d48)",
    color: "#fff",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
    boxShadow: "0 5px 15px rgba(225,29,72,0.3)"
  }
}
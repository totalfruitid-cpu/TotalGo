const styles = {
  page: { background: "#000", color: "#fff", minHeight: "100vh" },
  container: { 
    width: '100%',      
    margin: 0,          
    padding: 16, 
    boxSizing: 'border-box' 
  },
  loading: { padding: 20, textAlign: "center" },
  header: { display: "flex", justifyContent: "space-between", alignItems: 'center' },
  h1: { fontSize: 22, margin: 0 },
  email: { fontSize: 12, opacity: 0.7, margin: 0 },
  card: { background: "#111", padding: 16, borderRadius: 12, marginTop: 16 },
  input: { width: "100%", padding: 10, marginBottom: 10, boxSizing: 'border-box' },
  checkboxLabel: { display: "flex", gap: 8, marginBottom: 10, alignItems: 'center' },
  btnGroup: { display: "flex", gap: 8 },
  btnPrimary: { flex: 1, padding: 10, background: "#fff", color: "#000", borderRadius: 8, border: 'none' },
  btnSecondary: { flex: 1, padding: 10, background: "#333", color: "#fff", borderRadius: 8, border: 'none' },
  btnLogout: { padding: '8px 12px', background: "#222", color: "#fff", borderRadius: 8, border: 'none' }
}
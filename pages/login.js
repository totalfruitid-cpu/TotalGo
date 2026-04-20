import { useState, useEffect, useRef } from "react";
import { auth } from "../lib/firebase"; // db udah gak perlu di sini
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { useRouter } from "next/router";
// HAPUS: import Cookies from "js-cookie";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const redirectRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    return () => {
      redirectRef.current = false;
    };
  }, []);

  const redirectByRole = (role) => {
    if (redirectRef.current) return;
    redirectRef.current = true;

    if (role === "admin") router.replace("/admin");
    else if (role === "kasir") router.replace("/kasir");
    else {
      signOut(auth);
      redirectRef.current = false;
      setError("Role tidak dikenal");
    }
  };

  // HAPUS: getUserRoleFromFirestore - Kita gak cek role di client lagi

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          // HAPUS: Cookies.remove("authToken");
          // Cookie httpOnly gak bisa dihapus dari client
          setCheckingAuth(false);
          return;
        }

        // Kalo user udah login, langsung tanya role ke server
        const token = await user.getIdToken();

        // 1. Set cookie httpOnly ke server dulu
        await fetch('/api/setCookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        // 2. Baru tanya role ke server yg aman
        const res = await fetch('/api/checkRole');
        if (!res.ok) throw new Error('Gagal verifikasi role');
        const { role } = await res.json();

        redirectByRole(role);

      } catch (err) {
        console.error(err);
        setError(err.message);
        await signOut(auth);
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsub();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading || redirectRef.current) return;

    setLoading(true);
    setError("");

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const token = await cred.user.getIdToken();

      // 1. Kirim token ke server buat bikin cookie httpOnly
      await fetch('/api/setCookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      // 2. Tanya role ke server, bukan ke Firestore client
      const res = await fetch('/api/checkRole');
      if (!res.ok) throw new Error('Gagal verifikasi role');
      const { role } = await res.json();

      redirectByRole(role);

    } catch (err) {
      const map = {
        "auth/invalid-credential": "Email atau password salah",
        "auth/invalid-login-credentials": "Email atau password salah",
        "auth/user-not-found": "Email tidak terdaftar",
        "auth/wrong-password": "Password salah",
        "auth/user-disabled": "Akun dinonaktifkan",
        "auth/too-many-requests": "Terlalu banyak percobaan",
        "auth/network-request-failed": "Koneksi bermasalah",
      };

      setError(map[err.code] || err.message || "Login gagal");
      if (err.code) await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={styles.page}>
        <div style={styles.skeletonContainer}>
          <div style={styles.skeletonH2}></div>
          <div style={styles.skeletonInput}></div>
          <div style={styles.skeletonInput}></div>
          <div style={styles.skeletonBtn}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.h2}>Login TotalGo</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          <button
            disabled={loading || redirectRef.current}
            style={{
           ...styles.btn,
              opacity: loading? 0.6 : 1,
            }}
          >
            {loading? "Loading..." : "Login"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 20,
    background: "#000",
    color: "#fff",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: { width: "100%", maxWidth: 320 },
  h2: { textAlign: "center", marginBottom: 20 },
  input: {
    width: "100%",
    padding: 12,
    margin: "10px 0",
    background: "#222",
    border: "1px solid #333",
    color: "#fff",
    borderRadius: 8,
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: 12,
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 8,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 8,
  },
  error: {
    color: "#ff4d4d",
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
  },
  skeletonContainer: { width: "100%", maxWidth: 320 },
  skeletonH2: {
    height: 28,
    width: "60%",
    background: "#222",
    borderRadius: 8,
    margin: "0 auto 20px",
  },
  skeletonInput: {
    height: 44,
    width: "100%",
    background: "#222",
    borderRadius: 8,
    margin: "10px 0",
  },
  skeletonBtn: {
    height: 44,
    width: "100%",
    background: "#333",
    borderRadius: 8,
    marginTop: 8,
  },
};
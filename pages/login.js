import { useState, useEffect, useRef } from "react";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

const setAuthCookie = (token) => {
  Cookies.set("authToken", token, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: 1,
  });
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const redirectRef = useRef(false);
  const router = useRouter();

  // =========================
  // PATCH 1: RESET REF (FAST REFRESH SAFE)
  // =========================
  useEffect(() => {
    return () => {
      redirectRef.current = false;
    };
  }, []);

  // =========================
  // REDIRECT HANDLER
  // =========================
  const redirectByRole = (role) => {
    if (redirectRef.current) return;
    redirectRef.current = true;

    if (role === "admin") router.replace("/admin");
    else if (role === "kasir") router.replace("/kasir");
    else {
      signOut(auth);
      redirectRef.current = false;
    }
  };

  // =========================
  // AUTH CHECK
  // =========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          Cookies.remove("authToken");
          setCheckingAuth(false);
          return;
        }

        // PATCH 2: FORCE REFRESH TOKEN (REALTIME ROLE)
        const tokenResult = await user.getIdTokenResult(true);
        const role = tokenResult.claims.role;

        if (!role) {
          await signOut(auth);
          setCheckingAuth(false);
          return;
        }

        setAuthCookie(tokenResult.token);
        redirectByRole(role);
      } catch (err) {
        console.error(err);
        await signOut(auth);
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsub();
  }, [router]);

  // =========================
  // LOGIN HANDLER
  // =========================
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

      // PATCH 2: FORCE REFRESH TOKEN
      const tokenResult = await cred.user.getIdTokenResult(true);
      const role = tokenResult.claims.role;

      if (!role) {
        setError("Akun belum di-assign role");
        await signOut(auth);
        return;
      }

      setAuthCookie(tokenResult.token);
      redirectByRole(role);
    } catch (err) {
      const map = {
        "auth/invalid-credential": "Email atau password salah",
        "auth/user-not-found": "Email tidak terdaftar",
        "auth/wrong-password": "Password salah",
        "auth/too-many-requests": "Terlalu banyak percobaan",
        "auth/network-request-failed": "Koneksi bermasalah",
        "auth/user-disabled": "Akun dinonaktifkan",
      };

      setError(map[err.code] || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOADING STATE
  // =========================
  if (checkingAuth) {
    return (
      <div style={styles.page}>
        <p>Checking session...</p>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
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
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button
            disabled={loading || redirectRef.current}
            style={{
              ...styles.btn,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Loading..." : "Login"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

// =========================
// STYLE
// =========================
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
  },
  error: {
    color: "#ff4d4d",
    marginTop: 12,
    textAlign: "center",
    fontSize: 14,
  },
};
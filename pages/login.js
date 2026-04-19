import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // =========================
  // AUTO REDIRECT (kalau sudah login)
  // =========================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists()) {
          await signOut(auth);
          return;
        }

        const role = snap.data().role;

        if (role === "admin") router.replace("/admin");
        else if (role === "kasir") router.replace("/kasir");
        else await signOut(auth);

      } catch (err) {
        console.log("Auth check error:", err);
        await signOut(auth);
      }
    });

    return () => unsub();
  }, [router]);

  // =========================
  // HANDLE LOGIN
  // =========================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const snap = await getDoc(doc(db, "users", cred.user.uid));

      if (!snap.exists()) {
        setError("User belum terdaftar di database");
        await signOut(auth);
        setLoading(false);
        return;
      }

      const role = snap.data().role;

      if (role === "admin") {
        router.replace("/admin");
      } else if (role === "kasir") {
        router.replace("/kasir");
      } else {
        setError("Role tidak valid");
        await signOut(auth);
      }

    } catch (err) {
      setError("Email atau password salah");
    }

    setLoading(false);
  };

  // =========================
  // UI
  // =========================
  return (
    <div
      style={{
        padding: 20,
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        fontFamily: "sans-serif"
      }}
    >
      <h2>Login TotalGo</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            display: "block",
            margin: "10px 0",
            padding: 10,
            width: 280,
            background: "#222",
            border: "1px solid #333",
            color: "#fff",
            borderRadius: 6
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            display: "block",
            margin: "10px 0",
            padding: 10,
            width: 280,
            background: "#222",
            border: "1px solid #333",
            color: "#fff",
            borderRadius: 6
          }}
        />

        <button
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: "#fff",
            color: "#000",
            border: "none",
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          {loading ? "Loading..." : "Login"}
        </button>

        {error && (
          <p style={{ color: "#ff4d4d", marginTop: 12 }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
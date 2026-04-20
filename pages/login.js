import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Login ke Firebase
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCred.user.getIdToken();

      // 2. Kirim token ke API buat set cookie authToken + userRole
      const res = await fetch("/api/setCookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal set cookie");
      }

      const data = await res.json();
      
      // 3. Redirect sesuai role dari API
      if (data.role === "admin") {
        router.push("/admin");
      } else if (data.role === "kasir") {
        router.push("/kasir");
      } else {
        router.push("/");
      }
      
    } catch (err) {
      console.error(err);
      setError("Login gagal. Cek email / password.");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - TotalGo</title>
      </Head>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        background: "#f5f5f5"
      }}>
        <form onSubmit={handleLogin} style={{
          padding: 24,
          background: "white",
          borderRadius: 12,
          width: 320,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}>
          <h2>TotalGo Login</h2>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />

          {error && <p style={{ color: "red", fontSize: 12 }}>{error}</p>}

          <button style={btnStyle} disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  boxSizing: "border-box"
};

const btnStyle = {
  width: "100%",
  padding: 10,
  background: "#000",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};
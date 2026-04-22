import Head from "next/head"
import { useRouter } from "next/router"
import { signOut } from "firebase/auth"
import { auth } from "../lib/firebase"

export default function Unauthorized() {
  const router = useRouter()

  const handleBack = async () => {
    try {
      // 🔥 clear session biar gak nyangkut role lama
      await signOut(auth)
      localStorage.removeItem("role")
    } catch (err) {
      console.error(err)
    }

    router.replace("/login")
  }

  return (
    <>
      <Head>
        <title>403 - Unauthorized</title>
      </Head>

      <div style={styles.container}>
        <h1 style={styles.title}>403</h1>

        <p style={styles.text}>
          Kamu tidak punya akses ke halaman ini
        </p>

        <p style={styles.subtext}>
          Silakan login dengan akun admin / kasir yang sesuai
        </p>

        <button style={styles.button} onClick={handleBack}>
          Kembali ke Login
        </button>
      </div>
    </>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
    background: "#0f172a",
    color: "#fff",
    textAlign: "center",
    padding: 20,
  },
  title: {
    fontSize: 64,
    margin: 0,
  },
  text: {
    fontSize: 16,
    opacity: 0.9,
    marginTop: 10,
  },
  subtext: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 6,
    marginBottom: 20,
  },
  button: {
    padding: "10px 16px",
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
}
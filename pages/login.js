const login = async () => {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password)

    const idToken = await userCred.user.getIdToken()

    // 🔥 WAJIB: bikin session cookie
    await fetch("/api/sessionLogin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ idToken })
    })

    // 🔥 cek role
    const res = await fetch("/api/checkRole", {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    })

    const data = await res.json()

    if (data.role === "kasir") {
      router.push("/kasir")
    } else if (data.role === "admin") {
      router.push("/admin")
    } else {
      router.push("/store")
    }

  } catch (err) {
    alert(err.message)
  }
}
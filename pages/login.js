useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const role = userDoc.data().role
        if (role === 'kasir') router.replace('/kasir')
        else if (role === 'admin') router.replace('/admin')
        else router.replace('/')
      }
    }
  })
  return () => unsubscribe()
}, [router])

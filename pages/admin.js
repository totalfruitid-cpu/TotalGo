import admin from "../lib/firebaseAdmin"
import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from "firebase/firestore"

export default function Admin() {
  const [products, setProducts] = useState([])
  const [nama, setNama] = useState("")

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const snap = await getDocs(collection(db, "products"))
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const tambah = async () => {
    await addDoc(collection(db, "products"), { nama })
    setNama("")
    load()
  }

  const hapus = async (id) => {
    await deleteDoc(doc(db, "products", id))
    load()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>ADMIN</h1>

      <input value={nama} onChange={e => setNama(e.target.value)} />
      <button onClick={tambah}>Tambah</button>

      {products.map(p => (
        <div key={p.id}>
          {p.nama}
          <button onClick={() => hapus(p.id)}>Hapus</button>
        </div>
      ))}
    </div>
  )
}

// 🔥 PROTECT SERVER SIDE
export async function getServerSideProps(context) {
  try {
    const token = context.req.cookies.session

    if (!token) {
      return {
        redirect: { destination: "/login", permanent: false }
      }
    }

    const decoded = await admin.auth().verifySessionCookie(token, true)
    const uid = decoded.uid

    const doc = await admin.firestore().collection("users").doc(uid).get()

    if (!doc.exists) {
      return {
        redirect: { destination: "/login", permanent: false }
      }
    }

    const role = doc.data().role

    if (role !== "admin") {
      return {
        redirect: { destination: "/login", permanent: false }
      }
    }

    return { props: {} }

  } catch (err) {
    return {
      redirect: { destination: "/login", permanent: false }
    }
  }
}
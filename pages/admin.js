import { useState, useEffect } from 'react'
import Head from 'next/head'
import { auth, db } from "../lib/firebase"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from "firebase/firestore"

const BASE_URL_GAMBAR = "https://total-go.vercel.app/menu/"; // <-- CUMA NAMBAH INI DOANG DI LUAR

export default function Admin() {
  const [session, setSession] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    id: '',
    nama: '',
    punya_varian: true,
    harga_lite: '',
    harga_healthy: '',
    harga_sultan: '',
    stok: '',
    deskripsi: '',
    gambar_url: ''
  })
  const [login, setLogin] = useState({ email: 'totalfruit.id@gmail.com', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSession(user)
      if (user) loadProducts()
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, login.email, login.password)
    } catch (error) {
      setError(error.message)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    setProducts([])
  }

  const loadProducts = async () => {
    const q = query(collection(db, 'products'), orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)
    const data = querySnapshot.docs.map(doc => ({ id: doc.id,...doc.data() }))
    setProducts(data || [])
  }

  const handleVarianChange = (checked) => {
    if (!checked) {
      setForm({...form, punya_varian: false, harga_healthy: form.harga_lite, harga_sultan: form.harga_lite})
    } else {
      setForm({...form, punya_varian: true})
    }
  }

  const saveProduct = async (e) => {
    e.preventDefault()
    if (!form.nama) return alert('Nama wajib diisi')
    if (form.punya_varian && (!form.harga_lite ||!form.harga_healthy ||!form.harga_sultan)) {
      return alert('Semua harga varian wajib diisi')
    }
    if (!form.punya_varian &&!form.harga_lite) return alert('Harga wajib diisi')

    // === EDIT: GABUNGIN BASE URL PAS SAVE ===
    const linkLengkap = form.gambar_url ? BASE_URL_GAMBAR + form.gambar_url : null;
    // === SELESAI EDIT ===

    const payload = {
      nama: form.nama,
      punya_varian: form.punya_varian,
      harga_lite: parseInt(form.harga_lite) || 0,
      harga_healthy: parseInt(form.punya_varian? form.harga_healthy : form.harga_lite) || 0,
      harga_sultan: parseInt(form.punya_varian? form.harga_sultan : form.harga_lite) || 0,
      stok: parseInt(form.stok) || 0,
      deskripsi: form.deskripsi,
      gambar_url: linkLengkap // <-- EDIT: PAKE linkLengkap
    }

    try {
      if (form.id) {
        await updateDoc(doc(db, 'products', form.id), payload)
      } else {
        payload.created_at = serverTimestamp()
        await addDoc(collection(db, 'products'), payload)
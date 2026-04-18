import { useState, useEffect } from 'react';
import { db } from "../lib/firebase"
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore"
import Head from 'next/head';
import { Montserrat, Poppins } from 'next/font/google'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['800']
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['500']
})

const WA_NUMBER = '6285124441513';

function playClick() {
  // ... kode playClick lu ...
}

function generateQueueNumber() {
  // ... kode generateQueueNumber lu ...
}

export default function Home() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  // ... state lu yg lain ...
  
  // ... useEffect + function lu yg lain ...

  return (
    <>
      <Head>
        <title>TotalGo - Fast.Fresh.Prime</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ea580c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TotalGo" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>

      <div className="wrap">
        {/* ... semua JSX menu, cart, form order lu di sini ... */}
      </div>
    </>
  );
}


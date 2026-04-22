import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="id">
      <Head>

        {/* 🔥 PWA CORE */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ea580c" />

        {/* 🔥 MOBILE RESPONSIVE FIX */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />

        {/* 🔥 ICONS */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" href="/icon-192.png" />

        {/* 🔥 APP MODE (iOS) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TotalGo" />

        {/* 🔥 ANDROID */}
        <meta name="mobile-web-app-capable" content="yes" />

      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

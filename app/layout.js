import './globals.css'

export const metadata = {
  title: 'TotalGo Kasir',
  description: 'Sistem kasir premium TotalGo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-black text-[#FFD700] min-h-screen antialiased">
        <div className="bg-gradient-to-br from-black via-[#1a1a1a] to-black min-h-screen">
          {/* Header Mewah */}
          <header className="border-b border-[#FFD700]/20 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <h1 className="text-2xl font-bold tracking-wider">
                <span className="text-[#FFD700]">TOTAL</span>
                <span className="text-white">GO</span>
              </h1>
            </div>
          </header>

          {/* Isi halaman lu */}
          <main className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </main>

          {/* Footer tipis */}
          <footer className="border-t border-[#FFD700]/10 mt-12">
            <div className="max-w-6xl mx-auto px-6 py-4 text-center text-xs text-[#FFD700]/40">
              © 2026 TotalGo — Black Gold Edition
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'Notes App',
  description: 'Gin + Next.js CRUD Notes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="max-w-2xl mx-auto mt-8 px-4">{children}</main>
      </body>
    </html>
  )
}

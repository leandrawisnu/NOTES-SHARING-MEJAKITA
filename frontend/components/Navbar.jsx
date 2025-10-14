'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const checkLogin = () => setLoggedIn(!!localStorage.getItem('token'))

    checkLogin()

    // listen for custom 'authChange' event
    window.addEventListener('authChange', checkLogin)
    // also listen for storage events (for other tabs)
    window.addEventListener('storage', checkLogin)

    return () => {
      window.removeEventListener('authChange', checkLogin)
      window.removeEventListener('storage', checkLogin)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('authChange')) // 🔥 trigger event
    setLoggedIn(false)
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 p-4 flex justify-between items-center">
      <h1
        onClick={() => router.push('/')}
        className="text-lg font-semibold cursor-pointer text-white hover:text-blue-400 transition"
      >
        📝 NotesApp
      </h1>
      <div className="space-x-3">
        {!loggedIn ? (
          <>
            <button
              onClick={() => router.push('/login')}
              className="text-zinc-300 hover:text-white"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-white"
            >
              Register
            </button>
          </>
        ) : (
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}

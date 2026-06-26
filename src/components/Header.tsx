import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-amber-900 to-amber-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold group-hover:bg-amber-400 transition shadow-md">
            🍸
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sabores con IA</h1>
            <p className="text-xs text-amber-300 -mt-1">Descubre & Disfruta</p>
          </div>
        </Link>

        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <span className={`block w-6 h-0.5 bg-white transition ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        <nav className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/favorites" className="hover:text-amber-300 transition text-sm font-medium">
                ❤️ Favoritos
              </Link>
              <Link
                to="/dashboard"
                className="bg-amber-600 px-4 py-2 rounded-lg hover:bg-amber-500 transition text-sm font-medium"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-amber-300 transition text-sm font-medium">
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-amber-600 px-4 py-2 rounded-lg hover:bg-amber-500 transition text-sm font-medium"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-amber-700/50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to="/favorites"
                  className="block px-4 py-2 rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  ❤️ Favoritos
                </Link>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 transition text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 transition text-sm font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

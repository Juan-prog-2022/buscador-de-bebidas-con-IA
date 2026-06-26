import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <header className="bg-gradient-to-r from-amber-900 to-amber-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md">
              🍸
            </div>
            <h1 className="text-xl font-bold tracking-tight">Sabores con IA</h1>
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

          <nav className="hidden md:flex gap-4">
            <Link to="/" className="hover:text-amber-300 transition">Inicio</Link>
            {user ? (
              <Link to="/dashboard" className="hover:text-amber-300 transition">Dashboard</Link>
            ) : (
              <Link to="/login" className="hover:text-amber-300 transition">Iniciar Sesión</Link>
            )}
          </nav>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-amber-700/50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              <Link to="/" className="block px-4 py-2 rounded-lg hover:bg-amber-700 transition" onClick={() => setMenuOpen(false)}>Inicio</Link>
              {user ? (
                <Link to="/dashboard" className="block px-4 py-2 rounded-lg hover:bg-amber-700 transition" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              ) : (
                <Link to="/login" className="block px-4 py-2 rounded-lg hover:bg-amber-700 transition" onClick={() => setMenuOpen(false)}>Iniciar Sesión</Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6 animate-bounce">🍸</div>
          <h1 className="text-7xl font-bold text-amber-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página no encontrada</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            La página que buscas no existe o fue movida. Volvé al inicio para seguir explorando.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-500 transition shadow-md"
            >
              Volver al Inicio
            </Link>
            <Link
              to={user ? '/dashboard' : '/register'}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              {user ? 'Ir al Dashboard' : 'Registrarse'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

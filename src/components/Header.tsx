import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface HeaderProps {
  showDashboardLink?: boolean
}

export default function Header({ showDashboardLink }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="bg-gradient-to-r from-amber-900 to-amber-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold group-hover:bg-amber-400 transition shadow-md">
            🍸
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sabores con IA</h1>
            <p className="text-xs text-amber-300 -mt-1">Descubre & Disfruta</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
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
    </header>
  )
}

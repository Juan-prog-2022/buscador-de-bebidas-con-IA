import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-4">🍸</div>
        <h1 className="text-6xl font-bold text-amber-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página no encontrada</h2>
        <p className="text-gray-500 mb-8">
          La página que buscas no existe o fue movida. Volvé al inicio para seguir explorando.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-500 transition"
          >
            Volver al Inicio
          </Link>
          <Link
            to="/dashboard"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

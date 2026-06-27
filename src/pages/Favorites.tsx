import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Recipe {
  id: string
  name: string
  description: string
  ingredients: string[]
  imageUrl: string
  averageRating: number
  favoriteCount: number
  Category: { name: string; type: string }
  User: { name: string }
}

export default function Favorites() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [favorites, setFavorites] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    api.get('/favorites')
      .then((res) => setFavorites(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const handleRemove = async (recipeId: string) => {
    try {
      await api.delete(`/favorites/${recipeId}`)
      setFavorites((prev) => prev.filter((r) => r.id !== recipeId))
    } catch (err) {
      console.error(err)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100">
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md">
              🍸
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sabores con IA</h1>
              <p className="text-xs text-indigo-300 -mt-1">Tus Favoritos</p>
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
            <Link to="/dashboard" className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 transition text-sm font-medium">
              Dashboard
            </Link>
          </nav>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-indigo-700/50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              <Link
                to="/dashboard"
                className="block px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-sm font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">❤️ Mis Favoritos</h2>
          <span className="text-gray-500 text-sm">{favorites.length} recetas</span>
        </div>

        {loading ? (
          <div className="text-center text-indigo-700">Cargando...</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🤍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes favoritos aún</h3>
            <p className="text-gray-500 mb-6">Explora recetas y agrégalas a tus favoritos</p>
            <Link
              to="/"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-500 transition"
            >
              Explorar Recetas
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group">
                <Link to={`/recipes/${recipe.id}`}>
                  <div className="relative overflow-hidden">
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-indigo-400 to-gray-500 flex items-center justify-center text-5xl">
                        🍸
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-5">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                    {recipe.Category?.name}
                  </span>
                  <Link to={`/recipes/${recipe.id}`}>
                    <h4 className="text-xl font-semibold text-gray-800 mt-2 hover:text-indigo-600 transition">{recipe.name}</h4>
                  </Link>
                  <p className="text-gray-600 mt-1 text-sm line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">Por {recipe.User?.name}</span>
                    {recipe.averageRating > 0 && (
                      <span className="text-indigo-600 font-medium text-sm">★ {recipe.averageRating.toFixed(1)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(recipe.id)}
                    className="mt-3 w-full bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                  >
                    Quitar de favoritos
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

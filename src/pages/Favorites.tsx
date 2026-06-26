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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <header className="bg-gradient-to-r from-amber-900 to-amber-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md">
              🍸
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sabores con IA</h1>
              <p className="text-xs text-amber-300 -mt-1">Tus Favoritos</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/dashboard" className="bg-amber-600 px-4 py-2 rounded-lg hover:bg-amber-500 transition text-sm font-medium">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">❤️ Mis Favoritos</h2>
          <span className="text-gray-500 text-sm">{favorites.length} recetas</span>
        </div>

        {loading ? (
          <div className="text-center text-amber-700">Cargando...</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🤍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes favoritos aún</h3>
            <p className="text-gray-500 mb-6">Explora recetas y agrégalas a tus favoritos</p>
            <Link
              to="/"
              className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-500 transition"
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
                      <div className="w-full h-48 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-5xl">
                        🍸
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-5">
                  <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                    {recipe.Category?.name}
                  </span>
                  <Link to={`/recipes/${recipe.id}`}>
                    <h4 className="text-xl font-semibold text-gray-800 mt-2 hover:text-amber-600 transition">{recipe.name}</h4>
                  </Link>
                  <p className="text-gray-600 mt-1 text-sm line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">Por {recipe.User?.name}</span>
                    {recipe.averageRating > 0 && (
                      <span className="text-amber-600 font-medium text-sm">★ {recipe.averageRating.toFixed(1)}</span>
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

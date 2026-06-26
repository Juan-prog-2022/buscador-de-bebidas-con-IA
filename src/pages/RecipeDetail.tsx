import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Recipe {
  id: string
  name: string
  description: string
  ingredients: string[]
  instructions: string
  imageUrl: string
  averageRating: number
  favoriteCount: number
  isFavorited: boolean
  Category: { name: string; type: string }
  User: { id: string; name: string }
  Ratings: Rating[]
}

interface Rating {
  id: string
  score: number
  comment: string
  createdAt: string
  User: { id: string; name: string }
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [favLoading, setFavLoading] = useState(false)
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [ratingError, setRatingError] = useState('')
  const [ratingSuccess, setRatingSuccess] = useState('')

  const fetchRecipe = useCallback(async () => {
    try {
      const res = await api.get(`/recipes/${id}`)
      setRecipe(res.data)
      setIsFavorited(res.data.isFavorited)
      setFavoriteCount(res.data.favoriteCount)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRecipe()
  }, [fetchRecipe])

  const handleToggleFavorite = async () => {
    if (!user) return
    setFavLoading(true)
    try {
      if (isFavorited) {
        await api.delete(`/favorites/${id}`)
        setIsFavorited(false)
        setFavoriteCount((c) => Math.max(0, c - 1))
      } else {
        await api.post(`/favorites/${id}`)
        setIsFavorited(true)
        setFavoriteCount((c) => c + 1)
      }
    } catch (err: any) {
      if (err.response?.status !== 400) {
        console.error(err)
      }
    } finally {
      setFavLoading(false)
    }
  }

  const handleRating = async (e: React.FormEvent) => {
    e.preventDefault()
    setRatingError('')
    setRatingSuccess('')
    try {
      await api.post(`/ratings/${id}`, { score, comment })
      setRatingSuccess('¡Calificación enviada!')
      setComment('')
      const res = await api.get(`/recipes/${id}`)
      setRecipe(res.data)
    } catch (err: any) {
      setRatingError(err.response?.data?.error || 'Error al calificar')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center">
        <p className="text-amber-700">Cargando...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center">
        <p className="text-gray-600">Receta no encontrada</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <header className="bg-gradient-to-r from-amber-900 to-amber-800 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md">
              🍸
            </div>
            <h1 className="text-xl font-bold tracking-tight">Sabores con IA</h1>
          </Link>
          <nav className="flex gap-4">
            {user ? (
              <>
                <Link to="/favorites" className="hover:text-amber-300 transition">❤️ Favoritos</Link>
                <Link to="/dashboard" className="hover:text-amber-300 transition">Dashboard</Link>
              </>
            ) : (
              <Link to="/login" className="hover:text-amber-300 transition">Iniciar Sesión</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="text-amber-600 hover:text-amber-500 mb-4 inline-block">← Volver</Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-7xl">
              🍸
            </div>
          )}
          <div className="p-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                  {recipe.Category?.name}
                </span>
                {recipe.averageRating > 0 && (
                  <span className="text-amber-600 font-medium">★ {recipe.averageRating.toFixed(1)}</span>
                )}
              </div>
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  disabled={favLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isFavorited
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className={`text-lg ${isFavorited ? '' : 'opacity-50'}`}>
                    {isFavorited ? '❤️' : '🤍'}
                  </span>
                  {favoriteCount}
                </button>
              )}
              {!user && favoriteCount > 0 && (
                <span className="text-sm text-gray-500">❤️ {favoriteCount}</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-800">{recipe.name}</h1>
            <p className="text-gray-600 mt-2">{recipe.description}</p>
            <p className="text-sm text-gray-500 mt-1">Por {recipe.User?.name}</p>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">🧂 Ingredientes</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">📖 Preparación</h2>
              <p className="text-gray-700 whitespace-pre-line">{recipe.instructions}</p>
            </div>

            {user && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Calificar esta receta</h2>
                {ratingError && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-3 text-sm">{ratingError}</div>
                )}
                {ratingSuccess && (
                  <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-3 text-sm">{ratingSuccess}</div>
                )}
                <form onSubmit={handleRating} className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Puntuación:</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setScore(n)}
                          className={`text-2xl transition ${n <= score ? 'text-amber-500' : 'text-gray-300 hover:text-amber-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comentario (opcional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-500 transition"
                  >
                    Enviar Calificación
                  </button>
                </form>
              </div>
            )}

            {recipe.Ratings && recipe.Ratings.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Calificaciones ({recipe.Ratings.length})
                </h2>
                <div className="space-y-4">
                  {recipe.Ratings.map((r) => (
                    <div key={r.id} className="bg-amber-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{r.User?.name}</span>
                        <span className="text-amber-600">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
                      </div>
                      {r.comment && <p className="text-gray-600 mt-1 text-sm">{r.comment}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

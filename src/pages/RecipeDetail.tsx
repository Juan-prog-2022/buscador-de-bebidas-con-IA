import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import PostGenerator from '../components/PostGenerator'

interface Recipe {
  id: string
  name: string
  description: string
  ingredients: string[]
  instructions: string
  imageUrl: string
  averageRating: number
  favoriteCount: number
  costPrice: number
  suggestedPrice: number
  profitMargin: number
  laborCost: number
  isFavorited: boolean
  RecipeIngredients?: { ingredientId: string; quantity: number; Ingredient: { name: string; unit: string } }[]
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [ratingError, setRatingError] = useState('')
  const [ratingSuccess, setRatingSuccess] = useState('')
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([])
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [copied, setCopied] = useState(false)
  const [stockCheck, setStockCheck] = useState<{ allAvailable: boolean; items: { ingredientName: string; needed: number; available: number; sufficient: boolean; unit: string }[] } | null>(null)

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
    if (user) {
      api.get('/collections').then(r => setCollections(r.data)).catch(() => {})
    }
  }, [fetchRecipe, user])

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

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `¡Mirá esta receta: ${recipe?.name}!`

    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        break
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`, '_blank')
        break
    }
  }

  const handleAddToCollection = async (collectionId: string) => {
    try {
      await api.post(`/collections/${collectionId}/recipes/${id}`)
      setShowCollectionPicker(false)
    } catch { /* ignore */ }
  }

  const handleCheckStock = async () => {
    if (!user) return
    try {
      const res = await api.get(`/inventory/check-recipe/${id}`)
      setStockCheck(res.data)
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100 flex items-center justify-center">
        <p className="text-indigo-700">Cargando...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Receta no encontrada</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100">
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-lg print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md">
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
            <Link to="/collections" className="hover:text-indigo-300 transition">📚 Colecciones</Link>
            {user ? (
              <>
                <Link to="/favorites" className="hover:text-indigo-300 transition">❤️ Favoritos</Link>
                <Link to="/dashboard" className="hover:text-indigo-300 transition">Dashboard</Link>
              </>
            ) : (
              <Link to="/login" className="hover:text-indigo-300 transition">Iniciar Sesión</Link>
            )}
          </nav>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-indigo-700/50">
            <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-2">
              <Link
                to="/collections"
                className="block px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                onClick={() => setMenuOpen(false)}
              >
                📚 Colecciones
              </Link>
              {user ? (
                <>
                  <Link
                    to="/favorites"
                    className="block px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    onClick={() => setMenuOpen(false)}
                  >
                    ❤️ Favoritos
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="text-indigo-600 hover:text-indigo-500 mb-4 inline-block print:hidden">← Volver</Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-48 sm:h-64 object-cover" />
          ) : (
            <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-indigo-400 to-gray-500 flex items-center justify-center text-7xl">
              🍸
            </div>
          )}
          <div className="p-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                  {recipe.Category?.name}
                </span>
                {recipe.averageRating > 0 && (
                  <span className="text-indigo-600 font-medium">★ {recipe.averageRating.toFixed(1)}</span>
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
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => handleShare('copy')}
                    className="text-sm px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                    title="Compartir"
                  >
                    {copied ? '✅' : '📤'}
                  </button>
                  {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      ¡Link copiado!
                    </span>
                  )}
                </div>
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Mirá esta receta: ' + recipe.name + ' ' + window.location.href)}`, '_blank')}
                  className="text-sm px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                  title="Compartir en WhatsApp"
                >
                  💬
                </button>
                {user && collections.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowCollectionPicker(!showCollectionPicker)}
                      className="text-sm px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
                      title="Agregar a colección"
                    >
                      📚
                    </button>
                    {showCollectionPicker && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border z-10 w-56">
                        <p className="text-xs text-gray-500 px-4 pt-3 pb-1 font-medium">Agregar a colección</p>
                        {collections.map((col) => (
                          <button
                            key={col.id}
                            onClick={() => handleAddToCollection(col.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition"
                          >
                            {col.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => window.open(`/api/images/social-card/${id}`, '_blank')}
                  className="text-sm px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition print:hidden"
                  title="Tarjeta para redes sociales"
                >
                  🎴
                </button>
                <button
                  onClick={() => window.print()}
                  className="text-sm px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition print:hidden"
                  title="Imprimir"
                >
                  🖨️
                </button>
              </div>
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

              {user && recipe.RecipeIngredients?.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={handleCheckStock}
                    className="text-sm px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
                  >
                    📦 Verificar stock
                  </button>

                  {stockCheck && (
                    <div className={`mt-3 p-4 rounded-xl border ${
                      stockCheck.allAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <p className={`text-sm font-medium mb-2 ${stockCheck.allAvailable ? 'text-green-700' : 'text-red-700'}`}>
                        {stockCheck.allAvailable ? '✅ Todos los ingredientes están en stock' : '⚠️ Faltan ingredientes'}
                      </p>
                      <div className="space-y-1">
                        {stockCheck.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.ingredientName}</span>
                            <span className={item.sufficient ? 'text-green-600' : 'text-red-600'}>
                              {item.sufficient ? `${item.available} ${item.unit}` : `Faltan ${(item.needed - item.available).toFixed(1)} ${item.unit}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">📖 Preparación</h2>
              <p className="text-gray-700 whitespace-pre-line">{recipe.instructions}</p>
            </div>

            {(recipe.costPrice > 0 || recipe.suggestedPrice > 0) && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">💰 Costos y Márgenes</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-indigo-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Costo</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {recipe.costPrice > 0 ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(recipe.costPrice) : '—'}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Precio Venta</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {recipe.suggestedPrice > 0 ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(recipe.suggestedPrice) : '—'}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Margen</p>
                    <p className={`text-xl font-bold mt-1 ${recipe.profitMargin >= 50 ? 'text-green-600' : recipe.profitMargin >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {recipe.profitMargin > 0 ? `${recipe.profitMargin.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Ganancia</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {recipe.suggestedPrice > 0 && recipe.costPrice > 0
                        ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(recipe.suggestedPrice - recipe.costPrice)
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {user && (
              <div className="mt-8 border-t pt-6 print:hidden">
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
                          className={`text-2xl transition ${n <= score ? 'text-indigo-500' : 'text-gray-300 hover:text-indigo-300'}`}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-500 transition"
                  >
                    Enviar Calificación
                  </button>
                </form>
              </div>
            )}

            {recipe.Ratings && recipe.Ratings.length > 0 && (
              <div className="mt-8 border-t pt-6 print:hidden">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Calificaciones ({recipe.Ratings.length})
                </h2>
                <div className="space-y-4">
                  {recipe.Ratings.map((r) => (
                    <div key={r.id} className="bg-indigo-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{r.User?.name}</span>
                        <span className="text-indigo-600">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
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

            {user && (
              <div className="mt-8 border-t pt-6 print:hidden">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 Publicación para redes</h2>
                <PostGenerator
                  recipeName={recipe.name}
                  description={recipe.description}
                  price={recipe.suggestedPrice || recipe.costPrice}
                  category={recipe.Category?.name}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

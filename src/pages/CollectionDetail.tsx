import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useRecipeStore } from '../store/useRecipeStore'
import RecipeModal from '../components/RecipeModal'
import { getPlaceholderImg, getEmoji } from '../utils/helpers'

interface Collection {
  id: string
  name: string
  description: string
  isPublic: boolean
  User: { id: string; name: string }
  recipes: {
    id: string
    name: string
    description: string
    ingredients: string[]
    instructions: string
    imageUrl: string
    averageRating: number
    RecipeCollection: { order: number }
    Category: { id: string; name: string; type: string }
    User: { id: string; name: string }
  }[]
}

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const { openModal } = useRecipeStore()

  useEffect(() => {
    fetchCollection()
  }, [id])

  const fetchCollection = async () => {
    try {
      const res = await api.get(`/collections/${id}`)
      setCollection(res.data)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100 flex items-center justify-center"><p className="text-indigo-700">Cargando...</p></div>
  if (!collection) return <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100 flex items-center justify-center"><p className="text-gray-600">Colección no encontrada</p></div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100">
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md">🍸</div>
            <h1 className="text-xl font-bold tracking-tight">Sabores con IA</h1>
          </Link>
          <nav className="hidden md:flex gap-4 text-sm">
            <Link to="/collections" className="hover:text-indigo-300 transition">📚 Colecciones</Link>
            {user ? (
              <Link to="/dashboard" className="hover:text-indigo-300 transition">Dashboard</Link>
            ) : (
              <Link to="/login" className="hover:text-indigo-300 transition">Iniciar Sesión</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/collections" className="text-indigo-600 hover:text-indigo-500 mb-4 inline-block">← Todas las colecciones</Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{collection.name}</h1>
              {collection.description && <p className="text-gray-600 mt-2">{collection.description}</p>}
              <p className="text-sm text-gray-500 mt-2">
                Por {collection.User?.name} · {collection.recipes?.length || 0} recetas
                {collection.isPublic && <span className="ml-2 text-green-600">· Pública</span>}
              </p>
            </div>
          </div>
        </div>

        {collection.recipes && collection.recipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.recipes.map((recipe) => (
              <div key={recipe.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group">
                <div className="relative overflow-hidden">
                  <img
                    src={recipe.imageUrl || getPlaceholderImg(recipe.name)}
                    alt={recipe.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const emoji = document.createElement('div')
                        emoji.className = 'w-full h-48 flex items-center justify-center text-5xl bg-gradient-to-br from-indigo-100 to-gray-200'
                        emoji.textContent = getEmoji(recipe.Category?.type)
                        parent.appendChild(emoji)
                      }
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-medium text-indigo-700 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow">
                      {recipe.Category?.name}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-800">{recipe.name}</h3>
                  <p className="text-gray-600 mt-1 text-sm line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm text-gray-500">Por {recipe.User?.name}</span>
                    {recipe.averageRating > 0 && <span className="text-indigo-600 text-sm font-medium">★ {recipe.averageRating.toFixed(1)}</span>}
                  </div>
                  <button
                    onClick={() => openModal(recipe)}
                    className="mt-4 w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-500 transition"
                  >
                    📖 Ver Receta
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-gray-600">Esta colección está vacía.</p>
          </div>
        )}
      </main>
      <RecipeModal />
    </div>
  )
}

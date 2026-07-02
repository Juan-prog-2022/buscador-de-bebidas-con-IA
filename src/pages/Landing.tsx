import { useEffect, useState } from 'react'
import api from '../api/client'
import RecipeModal from '../components/RecipeModal'
import { useRecipeStore, type Recipe } from '../store/useRecipeStore'
import { getPlaceholderImg, getEmoji } from '../utils/helpers'

interface Category {
  id: string
  name: string
}

export default function Landing() {
  const { recipes, loading, fetchRecipes, openModal } = useRecipeStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchRecipes()
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const handleSearch = () => {
    const params: Record<string, string> = {}
    if (search.trim()) params.search = search.trim()
    if (categoryFilter) params.category = categoryFilter
    fetchRecipes(params)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-indigo-900 mb-8 text-center">
        Recetas Destacadas
      </h2>

      <div className="max-w-2xl mx-auto mb-8 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar recetas..."
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setTimeout(handleSearch, 0) }}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-indigo-700">Cargando...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center text-indigo-700">
          {search || categoryFilter
            ? 'No se encontraron recetas con esos filtros.'
            : 'No hay recetas disponibles aún. ¡Regístrate como propietario para añadir las primeras!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe: Recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={recipe.imageUrl || getPlaceholderImg(recipe.name)}
                  alt={recipe.name}
                  className="w-full h-52 object-cover group-hover:scale-105 transition duration-500"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      const emoji = document.createElement('div')
                      emoji.className =
                        'w-full h-52 flex items-center justify-center text-6xl bg-gradient-to-br from-indigo-100 to-gray-200'
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
                <h3 className="text-xl font-semibold text-gray-800">{recipe.name}</h3>
                <p className="text-gray-600 mt-1 text-sm line-clamp-2">{recipe.description}</p>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">Por {recipe.User?.name}</span>
                  <div className="flex items-center gap-3 text-sm">
                    {recipe.costPrice > 0 && (
                      <span className="text-gray-500">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(recipe.suggestedPrice || recipe.costPrice)}
                      </span>
                    )}
                    {recipe.favoriteCount > 0 && (
                      <span className="text-red-400">❤️ {recipe.favoriteCount}</span>
                    )}
                    {recipe.averageRating > 0 && (
                      <span className="text-indigo-600 font-medium">
                        ★ {recipe.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openModal(recipe)}
                  className="mt-4 w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-500 transition flex items-center justify-center gap-2"
                >
                  <span>📖</span> Ver Receta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecipeModal />
    </>
  )
}

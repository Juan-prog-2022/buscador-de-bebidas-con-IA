import { useEffect } from 'react'
import RecipeModal from '../components/RecipeModal'
import { useRecipeStore, type Recipe } from '../store/useRecipeStore'
import { getPlaceholderImg, getEmoji } from '../utils/helpers'

export default function Landing() {
  const { recipes, loading, fetchRecipes, openModal } = useRecipeStore()

  useEffect(() => {
    fetchRecipes()
  }, [])

  return (
    <>
      <h2 className="text-3xl font-bold text-amber-900 mb-8 text-center">
        Recetas Destacadas
      </h2>

      {loading ? (
        <div className="text-center text-amber-700">Cargando...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center text-amber-700">
          No hay recetas disponibles aún. ¡Regístrate como propietario para añadir las primeras!
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
                        'w-full h-52 flex items-center justify-center text-6xl bg-gradient-to-br from-amber-100 to-orange-200'
                      emoji.textContent = getEmoji(recipe.Category?.type)
                      parent.appendChild(emoji)
                    }
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-medium text-amber-700 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow">
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
                    {recipe.favoriteCount > 0 && (
                      <span className="text-red-400">❤️ {recipe.favoriteCount}</span>
                    )}
                    {recipe.averageRating > 0 && (
                      <span className="text-amber-600 font-medium">
                        ★ {recipe.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openModal(recipe)}
                  className="mt-4 w-full bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-500 transition flex items-center justify-center gap-2"
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

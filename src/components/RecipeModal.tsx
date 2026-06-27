import { useRecipeStore } from '../store/useRecipeStore'

export default function RecipeModal() {
  const { modalRecipe, modalOpen, closeModal } = useRecipeStore()

  if (!modalOpen || !modalRecipe) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-0"
        onClick={(e) => e.stopPropagation()}
      >
        {modalRecipe.imageUrl ? (
          <img
            src={modalRecipe.imageUrl}
            alt={modalRecipe.name}
            className="w-full h-48 sm:h-56 object-cover rounded-t-2xl"
          />
        ) : (
          <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-indigo-400 to-gray-500 rounded-t-2xl flex items-center justify-center text-6xl">
            🍸
          </div>
        )}

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
              {modalRecipe.Category?.name}
            </span>
            {modalRecipe.averageRating > 0 && (
              <span className="text-indigo-600 font-medium">
                ★ {modalRecipe.averageRating.toFixed(1)}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-800">{modalRecipe.name}</h2>
          <p className="text-gray-600 mt-1">{modalRecipe.description}</p>
          <p className="text-sm text-gray-500 mt-1">Por {modalRecipe.User?.name}</p>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-600">🧂</span> Ingredientes
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-700">
              {modalRecipe.ingredients?.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-indigo-600">📖</span> Preparación
            </h3>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {modalRecipe.instructions}
            </p>
          </div>

          <button
            onClick={closeModal}
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-500 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

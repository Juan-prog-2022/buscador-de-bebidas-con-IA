import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useRecipeStore } from '../store/useRecipeStore'

interface Category {
  id: string
  name: string
  type: string
}

interface RecipeForm {
  name: string
  description: string
  ingredients: string
  instructions: string
  imageUrl: string
  categoryId: string
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { recipes, fetchRecipes } = useRecipeStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RecipeForm>()

  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set())
  const [favLoading, setFavLoading] = useState<string | null>(null)

  const [aiPrompt, setAiPrompt] = useState('')
  const [aiType, setAiType] = useState<'drink' | 'dessert' | 'general'>('drink')
  const [aiResults, setAiResults] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    const [catRes, , favRes] = await Promise.all([
      api.get('/categories'),
      fetchRecipes(),
      api.get('/favorites').catch(() => ({ data: [] })),
    ])
    setCategories(catRes.data)
    setFavoritedIds(new Set(favRes.data.map((r: any) => r.id)))
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const resetForm = () => {
    reset({
      name: '',
      description: '',
      ingredients: '',
      instructions: '',
      imageUrl: '',
      categoryId: '',
    })
    setEditing(null)
    setShowForm(false)
    setFormError('')
  }

  const handleEdit = (recipe: any) => {
    setEditing(recipe.id)
    setValue('name', recipe.name)
    setValue('description', recipe.description || '')
    setValue('ingredients', Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : '')
    setValue('instructions', recipe.instructions || '')
    setValue('imageUrl', recipe.imageUrl || '')
    setValue('categoryId', recipe.categoryId || '')
    setShowForm(true)
  }

  const onSubmit = async (data: RecipeForm) => {
    setFormError('')
    const payload = {
      ...data,
      ingredients: data.ingredients.split('\n').filter(Boolean),
    }

    try {
      if (editing) {
        await api.put(`/recipes/${editing}`, payload)
      } else {
        await api.post('/recipes', payload)
      }
      resetForm()
      fetchRecipes()
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta receta?')) return
    try {
      await api.delete(`/recipes/${id}`)
      fetchRecipes()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar')
    }
  }

  const handleToggleFavorite = async (recipeId: string) => {
    setFavLoading(recipeId)
    try {
      if (favoritedIds.has(recipeId)) {
        await api.delete(`/favorites/${recipeId}`)
        setFavoritedIds((prev) => { const next = new Set(prev); next.delete(recipeId); return next })
      } else {
        await api.post(`/favorites/${recipeId}`)
        setFavoritedIds((prev) => new Set(prev).add(recipeId))
      }
    } catch { /* ignore */ } finally {
      setFavLoading(null)
    }
  }

  const handleAiRecommend = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiResults([])
    try {
      const res = await api.post('/ai/recommend', {
        prompt: aiPrompt,
        type: aiType,
        count: 5,
      })

      const data = res.data
      if (data.placeholder || data.mock) {
        setAiResults(data.mock || [])
        if (data.placeholder) {
          setAiError('IA no configurada. Mostrando datos de ejemplo.')
        }
      } else if (data.recommendations) {
        setAiResults(data.recommendations)
      }
    } catch (err: any) {
      const data = err.response?.data
      if (data?.mock) {
        setAiResults(data.mock)
        setAiError(data.error || 'Usando datos de ejemplo')
      } else {
        setAiError(err.response?.data?.error || 'Error al conectar con IA')
      }
    } finally {
      setAiLoading(false)
    }
  }

  const addAiResultAsRecipe = async (item: any) => {
    if (!categories.length) return
    const match = categories.find((c) => c.type === aiType)
    if (!match) return
    try {
      const imgRes = await api.get('/images/search', { params: { q: item.name } }).catch(() => null)
      const imageUrl = imgRes?.data?.images?.[0]?.url || ''
      await api.post('/recipes', {
        name: item.name,
        description: item.description || '',
        ingredients: item.ingredients || [],
        instructions: item.instructions || '',
        imageUrl,
        categoryId: match.id,
      })
      fetchRecipes()
      setAiResults([])
      setAiPrompt('')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar')
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
              <p className="text-xs text-amber-300 -mt-1">Dashboard</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/favorites" className="hover:text-amber-300 transition text-sm">❤️ Favoritos</Link>
            <span className="text-sm">{user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-amber-700 px-4 py-2 rounded-lg hover:bg-amber-600 transition text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recomendación con IA</h2>
          <p className="text-gray-600 mb-4">
            Describe qué tipo de receta buscas y la IA generará sugerencias.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: un cóctel tropical sin alcohol para el verano"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <select
              value={aiType}
              onChange={(e) => setAiType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="drink">Bebidas</option>
              <option value="dessert">Postres</option>
              <option value="general">General</option>
            </select>
            <button
              onClick={handleAiRecommend}
              disabled={aiLoading}
              className="bg-gradient-to-r from-amber-600 to-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:from-amber-500 hover:to-orange-400 transition disabled:opacity-50"
            >
              {aiLoading ? 'Pensando...' : 'Recomendar'}
            </button>
          </div>
          {aiError && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mb-3 text-sm">{aiError}</div>
          )}
          {aiResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {aiResults.map((item, i) => (
                <div key={i} className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                  <h4 className="font-semibold text-gray-800">{item.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  {item.ingredients && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500">Ingredientes:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {item.ingredients.map((ing: string, j: number) => (
                          <li key={j}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => addAiResultAsRecipe(item)}
                    className="mt-3 text-sm bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-500 transition"
                  >
                    + Añadir receta
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Mis Recetas</h2>
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-500 transition"
            >
              + Nueva Receta
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit(onSubmit)} className="bg-amber-50 rounded-xl p-6 mb-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editing ? 'Editar Receta' : 'Nueva Receta'}
              </h3>
              {formError && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{formError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    {...register('name', { required: 'El nombre es obligatorio' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    {...register('categoryId', { required: 'Selecciona una categoría' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredientes (uno por línea)
                </label>
                <textarea
                  {...register('ingredients', { required: 'Los ingredientes son obligatorios' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  rows={4}
                  placeholder="50ml Tequila&#10;30ml Jugo de limón&#10;Hielo"
                />
                {errors.ingredients && <p className="text-red-500 text-xs mt-1">{errors.ingredients.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones</label>
                <textarea
                  {...register('instructions', { required: 'Las instrucciones son obligatorias' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                  rows={4}
                />
                {errors.instructions && <p className="text-red-500 text-xs mt-1">{errors.instructions.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen (opcional)</label>
                <input
                  {...register('imageUrl')}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-500 transition"
                >
                  {editing ? 'Actualizar' : 'Crear Receta'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {recipes.length === 0 ? (
            <p className="text-gray-600">No hay recetas. ¡Crea la primera!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-gray-600 text-sm">
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Categoría</th>
                    <th className="pb-3 font-medium">Rating</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.map((recipe: any) => (
                    <tr key={recipe.id} className="border-b border-gray-100 hover:bg-amber-50">
                      <td className="py-3">
                        <Link to={`/recipes/${recipe.id}`} className="text-amber-700 hover:text-amber-500 font-medium">
                          {recipe.name}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-600">{recipe.Category?.name}</td>
                      <td className="py-3 text-amber-600">
                        {recipe.averageRating > 0 ? `★ ${recipe.averageRating.toFixed(1)}` : 'Sin rating'}
                      </td>
                      <td className="py-3 flex gap-2">
                        <button
                          onClick={() => handleToggleFavorite(recipe.id)}
                          disabled={favLoading === recipe.id}
                          className={`text-sm px-3 py-1 rounded-lg transition ${
                            favoritedIds.has(recipe.id)
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {favoritedIds.has(recipe.id) ? '❤️' : '🤍'}
                        </button>
                        <button
                          onClick={() => handleEdit(recipe)}
                          className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(recipe.id)}
                          className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

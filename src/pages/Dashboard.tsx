import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useRecipeStore } from '../store/useRecipeStore'
import { formatCurrency, formatProfitMargin } from '../utils/helpers'
import InventoryPanel from '../components/InventoryPanel'
import ProfitabilityPanel from '../components/ProfitabilityPanel'
import ImageGallery from '../components/ImageGallery'
import DigitalMenuPanel from '../components/DigitalMenuPanel'
import RecommendationsPanel from '../components/RecommendationsPanel'

interface Category {
  id: string
  name: string
  type: string
}

interface IngredientItem {
  id: string
  name: string
  unit: string
  unitPrice: number
  category?: string
}

interface RecipeForm {
  name: string
  description: string
  ingredients: string
  instructions: string
  imageUrl: string
  categoryId: string
  costPrice: number
  suggestedPrice: number
  laborCost: number
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { recipes, fetchRecipes } = useRecipeStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecipeForm>()

  const watchedName = watch('name')
  const watchedImageUrl = watch('imageUrl')

  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set())
  const [favLoading, setFavLoading] = useState<string | null>(null)

  const [aiPrompt, setAiPrompt] = useState('')
  const [aiType, setAiType] = useState<'drink' | 'dessert' | 'general'>('drink')
  const [aiResults, setAiResults] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const [ingredients, setIngredients] = useState<IngredientItem[]>([])
  const [showIngredientsPanel, setShowIngredientsPanel] = useState(false)
  const [ingredientForm, setIngredientForm] = useState({ name: '', unit: '', unitPrice: 0, category: '' })
  const [editingIngredient, setEditingIngredient] = useState<string | null>(null)
  const [showIngredientForm, setShowIngredientForm] = useState(false)

  const [selectedIngredients, setSelectedIngredients] = useState<{ ingredientId: string; quantity: number }[]>([])
  const [showCostSection, setShowCostSection] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    const [catRes, ingRes, , favRes] = await Promise.all([
      api.get('/categories'),
      api.get('/ingredients').catch(() => ({ data: [] })),
      fetchRecipes(),
      api.get('/favorites').catch(() => ({ data: [] })),
    ])
    setCategories(catRes.data)
    setIngredients(ingRes.data)
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
      costPrice: 0,
      suggestedPrice: 0,
      laborCost: 0,
    })
    setEditing(null)
    setShowForm(false)
    setFormError('')
    setSelectedIngredients([])
    setShowCostSection(false)
  }

  const handleEdit = async (recipe: any) => {
    setEditing(recipe.id)
    setValue('name', recipe.name)
    setValue('description', recipe.description || '')
    setValue('ingredients', Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : '')
    setValue('instructions', recipe.instructions || '')
    setValue('imageUrl', recipe.imageUrl || '')
    setValue('categoryId', recipe.categoryId || '')
    setValue('costPrice', recipe.costPrice || 0)
    setValue('suggestedPrice', recipe.suggestedPrice || 0)
    setValue('laborCost', recipe.laborCost || 0)
    setShowForm(true)

    if (recipe.RecipeIngredients?.length > 0) {
      setSelectedIngredients(
        recipe.RecipeIngredients.map((ri: any) => ({
          ingredientId: ri.ingredientId,
          quantity: ri.quantity,
        }))
      )
      setShowCostSection(true)
    } else {
      setSelectedIngredients([])
      setShowCostSection(recipe.costPrice > 0)
    }
  }

  const onSubmit = async (data: RecipeForm) => {
    setFormError('')
    const payload: any = {
      ...data,
      ingredients: data.ingredients.split('\n').filter(Boolean),
      costPrice: data.costPrice || 0,
      suggestedPrice: data.suggestedPrice || 0,
      laborCost: data.laborCost || 0,
    }

    if (selectedIngredients.length > 0) {
      payload.recipeIngredients = selectedIngredients
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

  const loadIngredients = async () => {
    try {
      const res = await api.get('/ingredients')
      setIngredients(res.data)
    } catch { /* ignore */ }
  }

  const resetIngredientForm = () => {
    setIngredientForm({ name: '', unit: '', unitPrice: 0, category: '' })
    setEditingIngredient(null)
    setShowIngredientForm(false)
  }

  const handleSaveIngredient = async () => {
    if (!ingredientForm.name || !ingredientForm.unit || ingredientForm.unitPrice <= 0) return
    try {
      if (editingIngredient) {
        await api.put(`/ingredients/${editingIngredient}`, ingredientForm)
      } else {
        await api.post('/ingredients', ingredientForm)
      }
      resetIngredientForm()
      loadIngredients()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar ingrediente')
    }
  }

  const handleEditIngredient = (ing: IngredientItem) => {
    setIngredientForm({ name: ing.name, unit: ing.unit, unitPrice: ing.unitPrice, category: ing.category || '' })
    setEditingIngredient(ing.id)
    setShowIngredientForm(true)
  }

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm('¿Eliminar este ingrediente?')) return
    try {
      await api.delete(`/ingredients/${id}`)
      loadIngredients()
    } catch { /* ignore */ }
  }

  const toggleIngredientSelection = (ingredientId: string) => {
    setSelectedIngredients((prev) => {
      const exists = prev.find((s) => s.ingredientId === ingredientId)
      if (exists) {
        return prev.filter((s) => s.ingredientId !== ingredientId)
      }
      return [...prev, { ingredientId, quantity: 1 }]
    })
  }

  const updateIngredientQuantity = (ingredientId: string, quantity: number) => {
    setSelectedIngredients((prev) =>
      prev.map((s) => (s.ingredientId === ingredientId ? { ...s, quantity } : s))
    )
  }

  const handleCalculateCost = async (recipeId: string) => {
    try {
      await api.post(`/recipes/${recipeId}/calculate-cost`)
      fetchRecipes()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al calcular costo')
    }
  }

  const getIngredientName = (id: string) => ingredients.find((i) => i.id === id)?.name || id

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
              <p className="text-xs text-indigo-300 -mt-1">Dashboard</p>
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

          <div className="hidden md:flex items-center gap-4">
            <Link to="/favorites" className="hover:text-indigo-300 transition text-sm">❤️ Favoritos</Link>
            <span className="text-sm">{user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-600 transition text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-indigo-700/50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              <span className="px-4 py-1 text-xs text-indigo-300">{user.name}</span>
              <Link
                to="/favorites"
                className="block px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                onClick={() => setMenuOpen(false)}
              >
                ❤️ Favoritos
              </Link>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false) }}
                className="block w-full text-left px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 transition text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <select
              value={aiType}
              onChange={(e) => setAiType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="drink">Bebidas</option>
              <option value="dessert">Postres</option>
              <option value="general">General</option>
            </select>
            <button
              onClick={handleAiRecommend}
              disabled={aiLoading}
              className="bg-gradient-to-r from-indigo-600 to-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:from-indigo-500 hover:to-gray-400 transition disabled:opacity-50"
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
                <div key={i} className="border border-indigo-200 rounded-xl p-4 bg-indigo-50">
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
                    className="mt-3 text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-500 transition"
                  >
                    + Añadir receta
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <section className="bg-white rounded-2xl shadow-xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Mis Recetas</h2>
              <button
                onClick={() => { resetForm(); setShowForm(true) }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 transition text-sm"
              >
                + Nueva Receta
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit(onSubmit)} className="bg-indigo-50 rounded-xl p-6 mb-6 space-y-4">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      {...register('categoryId', { required: 'Selecciona una categoría' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredientes (uno por línea)
                  </label>
                  <textarea
                    {...register('ingredients', { required: 'Los ingredientes son obligatorios' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    rows={4}
                    placeholder="50ml Tequila&#10;30ml Jugo de limón&#10;Hielo"
                  />
                  {errors.ingredients && <p className="text-red-500 text-xs mt-1">{errors.ingredients.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones</label>
                  <textarea
                    {...register('instructions', { required: 'Las instrucciones son obligatorias' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    rows={4}
                  />
                  {errors.instructions && <p className="text-red-500 text-xs mt-1">{errors.instructions.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
                  <div className="mb-2">
                    <input
                      {...register('imageUrl')}
                      type="url"
                      placeholder="URL de imagen (opcional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <ImageGallery
                    onSelect={(url) => setValue('imageUrl', url)}
                    currentImage={watchedImageUrl}
                    recipeName={watchedName}
                  />
                </div>

                <div className="border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCostSection(!showCostSection)}
                    className="text-indigo-600 font-medium text-sm hover:text-indigo-500"
                  >
                    {showCostSection ? '− Ocultar costos' : '+ Agregar costos y márgenes'}
                  </button>

                  {showCostSection && (
                    <div className="mt-4 space-y-4">
                      {ingredients.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ingredientes del catálogo (con costo)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                            {ingredients.map((ing) => {
                              const selected = selectedIngredients.find((s) => s.ingredientId === ing.id)
                              return (
                                <div
                                  key={ing.id}
                                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                                    selected ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-200 hover:border-indigo-300'
                                  }`}
                                  onClick={() => toggleIngredientSelection(ing.id)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={!!selected}
                                    onChange={() => {}}
                                    className="accent-indigo-600"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{ing.name}</p>
                                    <p className="text-xs text-gray-500">{formatCurrency(ing.unitPrice)} / {ing.unit}</p>
                                  </div>
                                  {selected && (
                                    <input
                                      type="number"
                                      value={selected.quantity}
                                      min={0}
                                      step={0.1}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => updateIngredientQuantity(ing.id, parseFloat(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                                    />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Costo de mano de obra ($)
                          </label>
                          <input
                            {...register('laborCost', { valueAsNumber: true })}
                            type="number"
                            min={0}
                            step={0.01}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio de costo ($)
                          </label>
                          <input
                            {...register('costPrice', { valueAsNumber: true })}
                            type="number"
                            min={0}
                            step={0.01}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio sugerido ($)
                          </label>
                          <input
                            {...register('suggestedPrice', { valueAsNumber: true })}
                            type="number"
                            min={0}
                            step={0.01}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-500 transition"
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
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-gray-600 text-sm">
                        <th className="pb-3 font-medium">Nombre</th>
                        <th className="pb-3 font-medium">Categoría</th>
                        <th className="pb-3 font-medium">Rating</th>
                        <th className="pb-3 font-medium">Costo</th>
                        <th className="pb-3 font-medium">Precio</th>
                        <th className="pb-3 font-medium">Margen</th>
                        <th className="pb-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipes.map((recipe: any) => (
                        <tr key={recipe.id} className="border-b border-gray-100 hover:bg-indigo-50">
                          <td className="py-3">
                            <Link to={`/recipes/${recipe.id}`} className="text-indigo-700 hover:text-indigo-500 font-medium">
                              {recipe.name}
                            </Link>
                          </td>
                          <td className="py-3 text-gray-600">{recipe.Category?.name}</td>
                          <td className="py-3 text-indigo-600">
                            {recipe.averageRating > 0 ? `★ ${recipe.averageRating.toFixed(1)}` : 'Sin rating'}
                          </td>
                          <td className="py-3 text-gray-700">
                            {recipe.costPrice > 0 ? formatCurrency(recipe.costPrice) : '—'}
                          </td>
                          <td className="py-3 text-gray-700">
                            {recipe.suggestedPrice > 0 ? formatCurrency(recipe.suggestedPrice) : '—'}
                          </td>
                          <td className="py-3">
                            {recipe.profitMargin > 0 ? (
                              <span className={`font-medium ${recipe.profitMargin >= 50 ? 'text-green-600' : recipe.profitMargin >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {formatProfitMargin(recipe.profitMargin)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
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
                              {recipe.RecipeIngredients?.length > 0 && (recipe.costPrice === 0) && (
                                <button
                                  onClick={() => handleCalculateCost(recipe.id)}
                                  className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition"
                                >
                                  Calcular
                                </button>
                              )}
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {recipes.map((recipe: any) => (
                    <div key={recipe.id} className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link to={`/recipes/${recipe.id}`} className="text-indigo-700 hover:text-indigo-500 font-semibold">
                            {recipe.name}
                          </Link>
                          <p className="text-xs text-gray-500">{recipe.Category?.name}</p>
                        </div>
                        <span className="text-indigo-600 text-xs">
                          {recipe.averageRating > 0 ? `★ ${recipe.averageRating.toFixed(1)}` : 'Sin rating'}
                        </span>
                      </div>
                      {(recipe.costPrice > 0 || recipe.suggestedPrice > 0) && (
                        <div className="flex gap-3 mb-2 text-xs">
                          {recipe.costPrice > 0 && <span className="text-gray-600">Costo: {formatCurrency(recipe.costPrice)}</span>}
                          {recipe.suggestedPrice > 0 && <span className="text-gray-600">Venta: {formatCurrency(recipe.suggestedPrice)}</span>}
                          {recipe.profitMargin > 0 && (
                            <span className={`font-medium ${recipe.profitMargin >= 50 ? 'text-green-600' : recipe.profitMargin >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {formatProfitMargin(recipe.profitMargin)}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleFavorite(recipe.id)}
                          disabled={favLoading === recipe.id}
                          className={`flex-1 text-sm px-3 py-1.5 rounded-lg transition ${
                            favoritedIds.has(recipe.id)
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {favoritedIds.has(recipe.id) ? '❤️' : '🤍'}
                        </button>
                        {recipe.RecipeIngredients?.length > 0 && (recipe.costPrice === 0) && (
                          <button
                            onClick={() => handleCalculateCost(recipe.id)}
                            className="flex-1 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition"
                          >
                            Calcular
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(recipe)}
                          className="flex-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(recipe.id)}
                          className="flex-1 text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">🧂 Ingredientes</h2>
              <button
                onClick={() => { setShowIngredientsPanel(!showIngredientsPanel); if (!showIngredientsPanel) loadIngredients() }}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                {showIngredientsPanel ? 'Cerrar' : 'Gestionar'}
              </button>
            </div>

            {showIngredientsPanel && (
              <div className="space-y-3">
                <button
                  onClick={() => { resetIngredientForm(); setShowIngredientForm(true) }}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 transition text-sm"
                >
                  + Nuevo Ingrediente
                </button>

                {showIngredientForm && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 border">
                    <h4 className="font-medium text-gray-800 text-sm">
                      {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
                    </h4>
                    <input
                      type="text"
                      value={ingredientForm.name}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                      placeholder="Nombre"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={ingredientForm.unit}
                        onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                        placeholder="Unidad (ml, g, uds)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <input
                        type="number"
                        value={ingredientForm.unitPrice}
                        min={0}
                        step={0.01}
                        onChange={(e) => setIngredientForm({ ...ingredientForm, unitPrice: parseFloat(e.target.value) || 0 })}
                        placeholder="Precio x unidad"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={ingredientForm.category}
                      onChange={(e) => setIngredientForm({ ...ingredientForm, category: e.target.value })}
                      placeholder="Categoría (opcional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveIngredient}
                        className="flex-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-500 transition"
                      >
                        {editingIngredient ? 'Actualizar' : 'Guardar'}
                      </button>
                      <button
                        onClick={resetIngredientForm}
                        className="flex-1 bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-400 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {ingredients.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No hay ingredientes. ¡Agrega tu primer ingrediente!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {ingredients.map((ing) => (
                      <div key={ing.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{ing.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(ing.unitPrice)} / {ing.unit}
                            {ing.category && <span> · {ing.category}</span>}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleEditIngredient(ing)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteIngredient(ing.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!showIngredientsPanel && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">🧂</p>
                <p className="text-sm">Gestiona tus ingredientes y sus precios</p>
                <p className="text-xs mt-1">Los costos se calculan automáticamente</p>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-xl p-6">
            <InventoryPanel />
          </section>
        </div>

        <section className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <ProfitabilityPanel />
        </section>

        <section className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <DigitalMenuPanel />
        </section>

        <section className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Recomendaciones Inteligentes</h2>
          <RecommendationsPanel />
        </section>
      </main>
    </div>
  )
}

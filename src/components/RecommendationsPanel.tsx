import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { formatCurrency, formatProfitMargin } from '../utils/helpers'

interface SeasonalRecipe {
  id: string
  name: string
  category: string
  imageUrl: string
  price: number
  margin: number
  ingredientCount: number
  availableIngredients: number
  readyToMake: boolean
}

interface InventoryReady {
  id: string
  name: string
  ingredientCount: number
  availableCount: number
  readyToMake: boolean
  missingIngredients: { name: string; needed: number; available: number; missing: number }[]
  price: number
  margin: number
}

interface Suggestion {
  type: string
  message: string
  priority: string
}

interface TrendItem {
  name: string
  description: string
  reason: string
  type: string
  suggestedPrice: number
  keyIngredients: string[]
}

export default function RecommendationsPanel() {
  const [season, setSeason] = useState<{ current: string; label: string } | null>(null)
  const [seasonalRecipes, setSeasonalRecipes] = useState<SeasonalRecipe[]>([])
  const [inventoryReady, setInventoryReady] = useState<InventoryReady[]>([])
  const [almostReady, setAlmostReady] = useState<InventoryReady[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [inventorySummary, setInventorySummary] = useState({ total: 0, lowStock: 0, inStock: 0 })
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const [trends, setTrends] = useState<TrendItem[]>([])
  const [trendsLoading, setTrendsLoading] = useState(false)
  const [trendsError, setTrendsError] = useState('')

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const res = await api.get('/recommendations')
      const data = res.data
      setSeason(data.season)
      setSeasonalRecipes(data.seasonalRecipes || [])
      setInventoryReady(data.inventoryReady || [])
      setAlmostReady(data.almostReady || [])
      setSuggestions(data.suggestions || [])
      setInventorySummary(data.inventorySummary || { total: 0, lowStock: 0, inStock: 0 })
      setLoaded(true)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const loadTrends = async () => {
    setTrendsLoading(true)
    setTrendsError('')
    setTrends([])
    try {
      const res = await api.post('/recommendations/ai-trends')
      const data = res.data
      if (data.trends) {
        setTrends(data.trends)
      } else {
        setTrendsError('No se pudieron generar tendencias')
      }
    } catch (err: any) {
      setTrendsError(err.response?.data?.error || 'Error al generar tendencias')
    } finally {
      setTrendsLoading(false)
    }
  }

  const priorityColors: Record<string, string> = {
    alta: 'border-red-300 bg-red-50 text-red-800',
    media: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    baja: 'border-green-300 bg-green-50 text-green-800',
  }

  const seasonEmojis: Record<string, string> = {
    verano: '🌞',
    invierno: '❄️',
    otono: '🍂',
    primavera: '🌸',
  }

  if (!loaded && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">Analizá tu inventario, recetas y temporada para obtener recomendaciones inteligentes.</p>
        <button
          onClick={loadRecommendations}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-indigo-500 hover:to-purple-500 transition shadow-md"
        >
          🔍 Analizar y Recomendar
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Analizando recetas e inventario...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {season?.label && `${seasonEmojis[season.current]} ${season.label}`} Recomendaciones
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Basadas en temporada, inventario y rendimiento
          </p>
        </div>
        <button
          onClick={loadRecommendations}
          className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          title="Actualizar"
        >
          ↻ Actualizar
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            <span>💡</span> Sugerencias inteligentes
          </h4>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className={`border-l-4 rounded-r-lg px-4 py-3 text-sm ${priorityColors[s.priority] || 'border-gray-300 bg-gray-50 text-gray-700'}`}
            >
              {s.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{inventorySummary.inStock}</p>
          <p className="text-xs text-green-600">En stock</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{inventorySummary.total}</p>
          <p className="text-xs text-blue-600">Ingredientes</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200">
          <p className="text-2xl font-bold text-red-700">{inventorySummary.lowStock}</p>
          <p className="text-xs text-red-600">Stock bajo</p>
        </div>
      </div>

      {inventoryReady.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <span className="text-green-600">✓</span> Listas para preparar ({inventoryReady.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {inventoryReady.map((r) => (
              <Link
                key={r.id}
                to={`/recipes/${r.id}`}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.ingredientCount} ingredientes</p>
                </div>
                <div className="text-right">
                  {r.price > 0 && <p className="text-sm font-medium text-gray-700">{formatCurrency(r.price)}</p>}
                  {r.margin > 0 && <p className="text-xs text-green-600">{formatProfitMargin(r.margin)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {almostReady.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <span className="text-yellow-600">◷</span> Casi listas — comprá pocos ingredientes
          </h4>
          <div className="space-y-2">
            {almostReady.slice(0, 5).map((r) => (
              <div key={r.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <Link to={`/recipes/${r.id}`} className="font-medium text-gray-800 text-sm hover:text-indigo-600">
                    {r.name}
                  </Link>
                  <span className="text-xs text-yellow-700 font-medium">
                    {r.availableCount}/{r.ingredientCount} ingredientes
                  </span>
                </div>
                {r.missingIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.missingIngredients.map((m, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                        {m.name} (faltan {m.missing})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {seasonalRecipes.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <span>{seasonEmojis[season?.current || '']}</span> Recetas de temporada
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {seasonalRecipes.map((r) => (
              <Link
                key={r.id}
                to={`/recipes/${r.id}`}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  r.readyToMake ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.category}</p>
                </div>
                <div className="text-right">
                  {r.price > 0 && <p className="text-sm font-medium text-gray-700">{formatCurrency(r.price)}</p>}
                  {r.margin > 0 && <p className="text-xs text-green-600">{formatProfitMargin(r.margin)}</p>}
                  {r.readyToMake && <span className="text-xs text-green-600 font-medium">✓ Disponible</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            <span>🤖</span> Tendencias IA
          </h4>
          <button
            onClick={loadTrends}
            disabled={trendsLoading}
            className="text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-500 transition disabled:opacity-50"
          >
            {trendsLoading ? 'Generando...' : 'Generar tendencias'}
          </button>
        </div>
        {trendsError && (
          <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-lg mb-3 border border-yellow-200">{trendsError}</div>
        )}
        {trends.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {trends.map((t, i) => (
              <div key={i} className="border border-purple-200 rounded-xl p-4 bg-purple-50">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-gray-800 text-sm">{t.name}</h5>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.type === 'drink' ? 'bg-blue-100 text-blue-700' :
                    t.type === 'dessert' ? 'bg-pink-100 text-pink-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {t.type === 'drink' ? '🍸 Bebida' : t.type === 'dessert' ? '🍰 Postre' : '🍽 General'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{t.description}</p>
                <p className="text-xs text-gray-500 italic mb-2">✨ {t.reason}</p>
                {t.keyIngredients && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.keyIngredients.map((ing, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
                {t.suggestedPrice > 0 && (
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(t.suggestedPrice)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

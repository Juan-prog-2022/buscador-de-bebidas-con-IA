import { useState, useEffect } from 'react'
import api from '../api/client'
import { formatCurrency, formatProfitMargin } from '../utils/helpers'

interface RecipeProfit {
  id: string
  name: string
  category: string
  ingredientCost: number
  laborCost: number
  totalCost: number
  sellingPrice: number
  profit: number
  margin: number
  imageUrl: string
}

interface Analysis {
  summary: {
    totalRecipes: number
    pricedRecipes: number
    avgMargin: number
    totalPotentialProfit: number
    lowMarginCount: number
    highMarginCount: number
    noPricingCount: number
  }
  items: RecipeProfit[]
  lowMargin: RecipeProfit[]
  highMargin: RecipeProfit[]
  noPricing: RecipeProfit[]
  suggestions: { type: string; recipeId?: string; recipeName?: string; message: string; impact: number; count?: number }[]
}

interface AiSuggestion {
  type: string
  title: string
  description: string
  priority: string
  expectedImpact: string
}

export default function ProfitabilityPanel() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'margin' | 'profit' | 'name'>('margin')

  useEffect(() => {
    loadAnalysis()
  }, [])

  const loadAnalysis = async () => {
    setLoading(true)
    try {
      const res = await api.get('/analytics/profitability')
      setAnalysis(res.data)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const handleAiSuggestions = async () => {
    if (!analysis) return
    setAiLoading(true)
    try {
      const menuData = analysis.items
        .filter(r => r.sellingPrice > 0)
        .map(r => ({
          name: r.name,
          costPrice: r.totalCost,
          sellingPrice: r.sellingPrice,
          margin: r.margin,
          category: r.category,
        }))

      const res = await api.post('/ai/profitability-suggestions', { menuData })
      if (res.data.suggestions) {
        setAiSuggestions(res.data.suggestions)
      }
    } catch { /* ignore */ } finally {
      setAiLoading(false)
    }
  }

  const sortedItems = () => {
    if (!analysis) return []
    const items = [...analysis.items]
    switch (sortBy) {
      case 'margin': return items.sort((a, b) => b.margin - a.margin)
      case 'profit': return items.sort((a, b) => b.profit - a.profit)
      case 'name': return items.sort((a, b) => a.name.localeCompare(b.name))
      default: return items
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando análisis...</div>
  }

  if (!analysis) {
    return <div className="text-center py-8 text-gray-500">Error al cargar análisis</div>
  }

  const { summary } = analysis

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">📈 Rentabilidad del Menú</h3>
        <button
          onClick={loadAnalysis}
          className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Margen Promedio</p>
          <p className={`text-lg font-bold ${summary.avgMargin >= 50 ? 'text-green-600' : summary.avgMargin >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
            {summary.pricedRecipes > 0 ? formatProfitMargin(summary.avgMargin) : '—'}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Ganancia Total</p>
          <p className="text-lg font-bold text-gray-800">{summary.totalPotentialProfit > 0 ? formatCurrency(summary.totalPotentialProfit) : '—'}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${summary.lowMarginCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className="text-xs text-gray-500">Margen Bajo</p>
          <p className={`text-lg font-bold ${summary.lowMarginCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>{summary.lowMarginCount}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${summary.noPricingCount > 0 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
          <p className="text-xs text-gray-500">Sin Precio</p>
          <p className={`text-lg font-bold ${summary.noPricingCount > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>{summary.noPricingCount}</p>
        </div>
      </div>

      {analysis.suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">💡 Sugerencias</h4>
          <ul className="space-y-1">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-0.5">
                  {s.type === 'price_increase' ? '💰' : s.type === 'promote' ? '🌟' : s.type === 'missing_pricing' ? '⚠️' : '💡'}
                </span>
                <span>{s.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Recetas</h4>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 text-xs border border-gray-300 rounded"
            >
              <option value="margin">Margen</option>
              <option value="profit">Ganancia</option>
              <option value="name">Nombre</option>
            </select>
          </div>
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {sortedItems().map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-gray-400 w-6 text-right">{item.items?.indexOf ? '' : ''}</span>
                <span className="text-gray-800 truncate">{item.name}</span>
                <span className="text-xs text-gray-400 hidden sm:inline">{item.category}</span>
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                {item.sellingPrice > 0 ? (
                  <>
                    <span className="text-gray-500">{formatCurrency(item.sellingPrice)}</span>
                    <span className={`font-medium w-14 text-right ${
                      item.margin >= 50 ? 'text-green-600' : item.margin >= 30 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatProfitMargin(item.margin)}
                    </span>
                    <span className="text-gray-500 w-16 text-right">{formatCurrency(item.profit)}</span>
                  </>
                ) : (
                  <span className="text-yellow-600">Sin precio</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <button
          onClick={handleAiSuggestions}
          disabled={aiLoading || summary.pricedRecipes === 0}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-medium hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-50 text-sm"
        >
          {aiLoading ? 'Analizando con IA...' : '🤖 Obtener sugerencias de IA'}
        </button>

        {aiSuggestions.length > 0 && (
          <div className="mt-4 space-y-3">
            {aiSuggestions.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 border ${
                s.priority === 'alta' ? 'bg-red-50 border-red-200' : s.priority === 'media' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-semibold text-gray-800 text-sm">{s.title}</h5>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.priority === 'alta' ? 'bg-red-200 text-red-800' : s.priority === 'media' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'
                  }`}>
                    {s.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{s.description}</p>
                {s.expectedImpact && (
                  <p className="text-xs text-gray-500 mt-1">🎯 Impacto esperado: {s.expectedImpact}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

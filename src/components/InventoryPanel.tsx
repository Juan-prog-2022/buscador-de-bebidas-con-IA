import { useState, useEffect } from 'react'
import api from '../api/client'

interface Ingredient {
  id: string
  name: string
  unit: string
}

interface InventoryItem {
  id: string
  ingredientId: string
  quantity: number
  minStock: number
  Ingredient: Ingredient
}

export default function InventoryPanel() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formIngredientId, setFormIngredientId] = useState('')
  const [formQuantity, setFormQuantity] = useState(0)
  const [formMinStock, setFormMinStock] = useState(0)
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjustQuantity, setAdjustQuantity] = useState(0)
  const [adjustMode, setAdjustMode] = useState<'add' | 'remove'>('add')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [invRes, ingRes] = await Promise.all([
      api.get('/inventory').catch(() => ({ data: [] })),
      api.get('/ingredients').catch(() => ({ data: [] })),
    ])
    setItems(invRes.data)
    setIngredients(ingRes.data)
  }

  const handleAdd = async () => {
    if (!formIngredientId || formQuantity <= 0) return
    try {
      await api.post('/inventory', {
        ingredientId: formIngredientId,
        quantity: formQuantity,
        minStock: formMinStock,
      })
      setShowForm(false)
      setFormIngredientId('')
      setFormQuantity(0)
      setFormMinStock(0)
      loadData()
    } catch { /* ignore */ }
  }

  const handleAdjust = async () => {
    if (!adjustId || adjustQuantity <= 0) return
    try {
      await api.post(`/inventory/${adjustId}/adjust`, {
        quantity: adjustQuantity,
        operation: adjustMode,
      })
      setAdjustId(null)
      setAdjustQuantity(0)
      loadData()
    } catch { /* ignore */ }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este item del inventario?')) return
    try {
      await api.delete(`/inventory/${id}`)
      loadData()
    } catch { /* ignore */ }
  }

  const unassignedIngredients = ingredients.filter(
    (ing) => !items.find((item) => item.ingredientId === ing.id)
  )

  const lowStockItems = items.filter((item) => item.minStock > 0 && item.quantity <= item.minStock)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">📦 Inventario</h3>
          {lowStockItems.length > 0 && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ {lowStockItems.length} ingrediente{lowStockItems.length > 1 ? 's' : ''} con stock bajo
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition"
        >
          + Agregar Stock
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3 border">
          <h4 className="font-medium text-gray-800 text-sm">Agregar al inventario</h4>
          <select
            value={formIngredientId}
            onChange={(e) => setFormIngredientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
          >
            <option value="">Seleccionar ingrediente...</option>
            {unassignedIngredients.map((ing) => (
              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={formQuantity || ''}
              min={0}
              step={0.1}
              onChange={(e) => setFormQuantity(parseFloat(e.target.value) || 0)}
              placeholder="Cantidad"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
            />
            <input
              type="number"
              value={formMinStock || ''}
              min={0}
              step={0.1}
              onChange={(e) => setFormMinStock(parseFloat(e.target.value) || 0)}
              placeholder="Stock mínimo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-500 transition">Guardar</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-400 transition">Cancelar</button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">📦</p>
          <p className="text-sm">No hay inventario registrado</p>
          <p className="text-xs mt-1">Agrega ingredientes al inventario para controlar el stock</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                item.minStock > 0 && item.quantity <= item.minStock
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">{item.Ingredient?.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className={item.quantity <= item.minStock ? 'text-red-600 font-medium' : ''}>
                    Stock: {item.quantity} {item.Ingredient?.unit}
                  </span>
                  {item.minStock > 0 && <span>Min: {item.minStock}</span>}
                </div>
              </div>

              {adjustId === item.id ? (
                <div className="flex items-center gap-1 ml-2">
                  <select
                    value={adjustMode}
                    onChange={(e) => setAdjustMode(e.target.value as any)}
                    className="px-1 py-1 text-xs border rounded"
                  >
                    <option value="add">+</option>
                    <option value="remove">-</option>
                  </select>
                  <input
                    type="number"
                    value={adjustQuantity || ''}
                    min={0}
                    step={0.1}
                    onChange={(e) => setAdjustQuantity(parseFloat(e.target.value) || 0)}
                    className="w-16 px-1 py-1 text-xs border rounded text-center"
                    autoFocus
                  />
                  <button onClick={handleAdjust} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">OK</button>
                  <button onClick={() => setAdjustId(null)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">×</button>
                </div>
              ) : (
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => { setAdjustId(item.id); setAdjustQuantity(0); setAdjustMode('add') }}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Ajustar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

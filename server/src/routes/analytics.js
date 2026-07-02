import { Router } from 'express'
import { z } from 'zod'
import { Recipe, Category, RecipeIngredient, Ingredient } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/profitability', authenticate, async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Category, attributes: ['id', 'name', 'type'] },
        { model: RecipeIngredient, include: [Ingredient] },
      ],
      order: [['createdAt', 'DESC']],
    })

    const analysis = recipes.map((recipe) => {
      const r = recipe.toJSON()
      const ingredientCost = (r.RecipeIngredients || []).reduce((sum, ri) => {
        return sum + (ri.quantity * (ri.Ingredient?.unitPrice || 0))
      }, 0)
      const totalCost = ingredientCost + (r.laborCost || 0)
      const sellingPrice = r.suggestedPrice || 0
      const margin = sellingPrice > 0 ? ((sellingPrice - totalCost) / sellingPrice) * 100 : 0
      const profit = sellingPrice - totalCost

      return {
        id: r.id,
        name: r.name,
        category: r.Category?.name || '',
        type: r.Category?.type || '',
        ingredientCost: Math.round(ingredientCost * 100) / 100,
        laborCost: r.laborCost || 0,
        totalCost: Math.round(totalCost * 100) / 100,
        sellingPrice,
        profit: Math.round(profit * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        imageUrl: r.imageUrl,
      }
    })

    const withMargin = analysis.filter((r) => r.sellingPrice > 0)
    const avgMargin = withMargin.length > 0
      ? Math.round(withMargin.reduce((s, r) => s + r.margin, 0) / withMargin.length * 100) / 100
      : 0

    const lowMargin = withMargin
      .filter((r) => r.margin < 30)
      .sort((a, b) => a.margin - b.margin)

    const highMargin = withMargin
      .filter((r) => r.margin >= 60)
      .sort((a, b) => b.margin - a.margin)

    const noPricing = analysis.filter((r) => r.sellingPrice === 0)

    const suggestions = generateSuggestions(analysis, avgMargin)

    res.json({
      summary: {
        totalRecipes: recipes.length,
        pricedRecipes: withMargin.length,
        avgMargin,
        totalPotentialProfit: Math.round(withMargin.reduce((s, r) => s + r.profit, 0) * 100) / 100,
        lowMarginCount: lowMargin.length,
        highMarginCount: highMargin.length,
        noPricingCount: noPricing.length,
      },
      items: analysis,
      lowMargin,
      highMargin,
      noPricing,
      suggestions,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function generateSuggestions(analysis, avgMargin) {
  const suggestions = []

  const lowMargin = analysis.filter((r) => r.sellingPrice > 0 && r.margin < 30)
  if (lowMargin.length > 0) {
    lowMargin.forEach((r) => {
      const targetPrice = Math.round(r.totalCost / 0.5 * 100) / 100
      const increase = Math.round((targetPrice - r.sellingPrice) * 100) / 100
      if (increase > 0) {
        suggestions.push({
          type: 'price_increase',
          recipeId: r.id,
          recipeName: r.name,
          message: `Subir ${r.name} de ${formatCurrency(r.sellingPrice)} a ${formatCurrency(targetPrice)} (${formatCurrency(increase)} más) para alcanzar 50% de margen`,
          impact: Math.round(increase * 100) / 100,
        })
      }
    })
  }

  const highMargin = analysis.filter((r) => r.margin >= 60).sort((a, b) => b.margin - a.margin)
  if (highMargin.length > 0) {
    suggestions.push({
      type: 'promote',
      recipeName: highMargin[0].name,
      message: `Promocionar ${highMargin[0].name} — tiene el margen más alto (${highMargin[0].margin.toFixed(1)}%)`,
      impact: highMargin[0].profit,
    })
  }

  const noPricing = analysis.filter((r) => r.sellingPrice === 0)
  if (noPricing.length > 0) {
    suggestions.push({
      type: 'missing_pricing',
      count: noPricing.length,
      message: `${noPricing.length} receta${noPricing.length > 1 ? 's' : ''} sin precio asignado. Asignar precios para calcular rentabilidad.`,
      impact: 0,
    })
  }

  if (avgMargin < 40) {
    suggestions.push({
      type: 'avg_margin_warning',
      message: `El margen promedio (${avgMargin.toFixed(1)}%) está por debajo del 40%. Revisar costos de ingredientes y precios de venta.`,
      impact: 0,
    })
  }

  suggestions.push({
    type: 'tip',
    message: 'Reducir costos de ingredientes comprando al por mayor o buscando proveedores alternativos puede aumentar el margen significativamente.',
    impact: 0,
  })

  return suggestions
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount)
}

export default router

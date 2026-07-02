import { Router } from 'express'
import { z } from 'zod'
import { Recipe, Category, RecipeIngredient, Ingredient, InventoryItem } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'
import dotenv from 'dotenv'

dotenv.config()
const router = Router()

function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  if (month >= 12 || month <= 2) return { season: 'verano', label: 'Verano 🌞', months: 'diciembre-febrero' }
  if (month >= 3 && month <= 5) return { season: 'otono', label: 'Otoño 🍂', months: 'marzo-mayo' }
  if (month >= 6 && month <= 8) return { season: 'invierno', label: 'Invierno ❄️', months: 'junio-agosto' }
  return { season: 'primavera', label: 'Primavera 🌸', months: 'septiembre-noviembre' }
}

const seasonalIngredients = {
  verano: ['limón', 'lima', 'menta', 'piña', 'naranja', 'frutilla', 'sandía', 'melón', 'coco', 'hielo', 'gaseosa', 'cidra'],
  otono: ['manzana', 'pera', 'calabaza', 'canela', 'nuez', 'batata', 'hongo', 'vino tinto', 'whisky'],
  invierno: ['canela', 'clavo de olor', 'jengibre', 'chocolate', 'vino tinto', 'whisky', 'café', 'naranja', 'leche', 'crema'],
  primavera: ['frutilla', 'limón', 'menta', 'albahaca', 'pomelo', 'naranja', 'flor de saúco', 'jengibre'],
}

const seasonalPrompts = {
  verano: 'bebidas refrescantes tropicales sin alcohol y cócteles frutales para el calor',
  otono: 'cócteles especiados y postres con sabores otoñales como manzana y canela',
  invierno: 'bebidas calientes, cócteles con especias, chocolate caliente y postres horneados',
  primavera: 'cócteles florales y frescos, postres con frutas de estación',
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { season: currentSeason, label: seasonLabel } = getCurrentSeason()
    const seasonalIngs = seasonalIngredients[currentSeason]

    const recipes = await Recipe.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Category, attributes: ['id', 'name', 'type'] },
        { model: RecipeIngredient, include: [Ingredient] },
      ],
    })

    const inventoryItems = await InventoryItem.findAll({
      where: { userId: req.user.id },
      include: [Ingredient],
    })

    const inventoryMap = {}
    inventoryItems.forEach((item) => {
      inventoryMap[item.ingredientId] = item.quantity
    })

    const seasonalRecipes = recipes.filter((r) => {
      const ings = r.RecipeIngredients || []
      return ings.some((ri) => {
        const name = ri.Ingredient?.name?.toLowerCase() || ''
        return seasonalIngs.some((si) => name.includes(si))
      })
    }).map((r) => {
      const recipe = r.toJSON()
      const ings = recipe.RecipeIngredients || []
      const availableCount = ings.filter((ri) => {
        const needed = ri.quantity
        const available = inventoryMap[ri.ingredientId] || 0
        return available >= needed
      }).length
      return {
        id: recipe.id,
        name: recipe.name,
        category: recipe.Category?.name || '',
        imageUrl: recipe.imageUrl,
        price: recipe.suggestedPrice || 0,
        margin: recipe.profitMargin || 0,
        ingredientCount: ings.length,
        availableIngredients: availableCount,
        readyToMake: ings.length > 0 && availableCount === ings.length,
      }
    })

    const readyFromInventory = recipes.map((r) => {
      const recipe = r.toJSON()
      const ings = recipe.RecipeIngredients || []
      if (ings.length === 0) return null
      const availableCount = ings.filter((ri) => {
        const needed = ri.quantity
        const available = inventoryMap[ri.ingredientId] || 0
        return available >= needed
      }).length
      return {
        id: recipe.id,
        name: recipe.name,
        ingredientCount: ings.length,
        availableCount,
        readyToMake: availableCount === ings.length,
        missingIngredients: ings.filter((ri) => {
          const needed = ri.quantity
          const available = inventoryMap[ri.ingredientId] || 0
          return available < needed
        }).map((ri) => ({
          name: ri.Ingredient?.name || 'Unknown',
          needed: ri.quantity,
          available: inventoryMap[ri.ingredientId] || 0,
          missing: Math.max(0, ri.quantity - (inventoryMap[ri.ingredientId] || 0)),
        })),
        price: recipe.suggestedPrice || 0,
        margin: recipe.profitMargin || 0,
      }
    }).filter(Boolean)

    const readyRecipes = readyFromInventory.filter((r) => r.readyToMake)
    const almostReady = readyFromInventory
      .filter((r) => !r.readyToMake && r.availableCount > 0)
      .sort((a, b) => b.availableCount / b.ingredientCount - a.availableCount / a.ingredientCount)

    const suggestions = []
    const lowStock = inventoryItems.filter((item) => item.minStock > 0 && item.quantity <= item.minStock)
    if (lowStock.length > 0) {
      suggestions.push({
        type: 'restock',
        message: `Reponer ${lowStock.length} ingrediente${lowStock.length > 1 ? 's' : ''} con stock bajo: ${lowStock.map(i => i.Ingredient?.name).join(', ')}`,
        priority: 'alta',
      })
    }

    if (seasonalRecipes.length > 0) {
      suggestions.push({
        type: 'seasonal',
        message: `Promocionar recetas de ${seasonLabel}: ${seasonalRecipes.slice(0, 3).map(r => r.name).join(', ')}`,
        priority: 'media',
      })
    }

    const topMarginSeasonal = seasonalRecipes
      .filter((r) => r.margin > 0)
      .sort((a, b) => b.margin - a.margin)
    if (topMarginSeasonal.length > 0) {
      suggestions.push({
        type: 'profit_seasonal',
        message: `${topMarginSeasonal[0].name} tiene el mejor margen (${topMarginSeasonal[0].margin.toFixed(1)}%) entre las recetas de temporada. ¡Destacarla en el menú!`,
        priority: 'alta',
      })
    }

    if (readyRecipes.length > 0) {
      suggestions.push({
        type: 'ready_to_make',
        message: `Tenés ingredientes para preparar ${readyRecipes.length} receta${readyRecipes.length > 1 ? 's' : ''}: ${readyRecipes.map(r => r.name).join(', ')}`,
        priority: 'alta',
      })
    }

    res.json({
      season: { current: currentSeason, label: seasonLabel },
      seasonalRecipes,
      inventoryReady: readyRecipes,
      almostReady,
      suggestions,
      inventorySummary: {
        total: inventoryItems.length,
        lowStock: lowStock.length,
        inStock: inventoryItems.filter((i) => i.quantity > 0).length,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/ai-trends', authenticate, async (req, res) => {
  try {
    const { current: currentSeason, label: seasonLabel } = getCurrentSeason()
    const prompt = seasonalPrompts[currentSeason] || 'recomendaciones gastronómicas'

    const inventoryItems = await InventoryItem.findAll({
      where: { userId: req.user.id },
      include: [Ingredient],
    })
    const availableIngs = inventoryItems
      .filter((i) => i.quantity > i.minStock)
      .map((i) => i.Ingredient?.name)
      .filter(Boolean)

    const systemPrompt = `Eres un sommelier y chef experto en tendencias gastronómicas para bares y restaurantes en Argentina.
Es ${seasonLabel}. Los ingredientes disponibles en inventario son: ${availableIngs.join(', ') || 'no especificados'}.

Genera 3 recomendaciones originales para el menú. Cada recomendación debe ser un objeto con:
- name (string): nombre creativo del plato/bebida
- description (string): descripción atractiva
- reason (string): por qué funciona en esta temporada
- type (string): "drink", "dessert", o "general"
- suggestedPrice (number): precio sugerido en ARS
- keyIngredients (array de strings): 3-4 ingredientes clave

Responde SOLO con un array JSON.`

    const apiKey = process.env.AI_API_KEY

    if (!apiKey || apiKey === 'sk-placeholder') {
      return res.json({
        trends: generateMockTrends(currentSeason, seasonLabel),
        season: seasonLabel,
      })
    }

    const response = await fetch(process.env.AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Dame 3 recomendaciones para ${seasonLabel} usando ingredientes disponibles.` },
        ],
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      return res.json({ trends: generateMockTrends(currentSeason, seasonLabel), season: seasonLabel })
    }

    const data = await response.json()
    let trends

    try {
      const content = data.choices[0].message.content
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      trends = JSON.parse(cleaned)
    } catch {
      trends = generateMockTrends(currentSeason, seasonLabel)
    }

    res.json({ trends, season: seasonLabel })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function generateMockTrends(season, label) {
  const templates = {
    verano: [
      { name: 'Spritz de Pomelo y Romero', description: 'Cóctel refrescante con pomelo rosado, romero fresco y agua tónica', reason: 'Perfecto para el calor del verano, ligero y cítrico', type: 'drink', suggestedPrice: 2800, keyIngredients: ['Pomelo', 'Romero', 'Agua tónica', 'Hielo'] },
      { name: 'Ensalada de Frutas Tropicales', description: 'Mix de mango, piña, frutilla con dressing de maracuyá y menta', reason: 'Aprovecha las frutas de estación', type: 'general', suggestedPrice: 3200, keyIngredients: ['Mango', 'Piña', 'Frutilla', 'Menta'] },
      { name: 'Frozen Margarita de Maracuyá', description: 'Margarita frozen con pulpa de maracuyá y rim de coco tostado', reason: 'Tropical y refrescante, ideal para terraceo', type: 'drink', suggestedPrice: 3500, keyIngredients: ['Maracuyá', 'Tequila', 'Coco', 'Hielo'] },
    ],
    invierno: [
      { name: 'Chocolate Caliente Especiado', description: 'Chocolate caliente con canela, clavo de olor y un toque de whisky', reason: 'Bebida reconfortante para las noches frías', type: 'drink', suggestedPrice: 2500, keyIngredients: ['Chocolate', 'Canela', 'Whisky', 'Crema'] },
      { name: 'Tarta de Manzana y Nueces', description: 'Tarta horneada con manzanas caramelizadas y nueces, servida con helado', reason: 'Postre clásico de invierno que evoca hogar', type: 'dessert', suggestedPrice: 3800, keyIngredients: ['Manzana', 'Nueces', 'Canela', 'Helado'] },
      { name: 'Vino Caliente con Especias', description: 'Vino tinto especiado con naranja, canela y anís', reason: 'Tradicional bebida invernal que calienta el alma', type: 'drink', suggestedPrice: 2200, keyIngredients: ['Vino tinto', 'Naranja', 'Canela', 'Anís'] },
    ],
    otono: [
      { name: 'Old Fashioned de Pera', description: 'Clásico reinventado con puré de pera y sirope de canela', reason: 'Los sabores otoñales de la pera combinan perfecto con el whisky', type: 'drink', suggestedPrice: 3200, keyIngredients: ['Whisky', 'Pera', 'Canela', 'Naranja'] },
      { name: 'Flan de Calabaza', description: 'Flan cremoso de calabaza con caramelo y nueces pecanas', reason: 'Aprovecha la calabaza de estación', type: 'dessert', suggestedPrice: 3000, keyIngredients: ['Calabaza', 'Huevos', 'Nueces', 'Caramelo'] },
      { name: 'Cóctel de Hongos Salvajes', description: 'Entrada caliente con hongos de estación, trufa y polenta cremosa', reason: 'Los hongos están en su mejor momento', type: 'general', suggestedPrice: 4200, keyIngredients: ['Hongos', 'Trufa', 'Polenta', 'Queso parmesano'] },
    ],
    primavera: [
      { name: 'Cóctel de Flor de Saúco', description: 'Efervescente cóctel con licor de saúco, limón y frutillas', reason: 'Fresco y floral, captura la esencia de la primavera', type: 'drink', suggestedPrice: 3000, keyIngredients: ['Saúco', 'Limón', 'Frutilla', 'Agua tónica'] },
      { name: 'Tarta de Frutillas y Albahaca', description: 'Tarta ligera con frutillas frescas, crema de albahaca y masa quebrada', reason: 'Las frutillas están en su punto justo', type: 'dessert', suggestedPrice: 3400, keyIngredients: ['Frutilla', 'Albahaca', 'Crema', 'Masa quebrada'] },
      { name: 'Ensalada de Rúcula y Pomelo', description: 'Ensalada fresca con rúcula, pomelo, queso de cabra y vinagreta de miel', reason: 'Ligera y fresca, perfecta para los días que empiezan a calentar', type: 'general', suggestedPrice: 2800, keyIngredients: ['Rúcula', 'Pomelo', 'Queso de cabra', 'Miel'] },
    ],
  }

  return templates[season] || templates.primavera
}

export default router

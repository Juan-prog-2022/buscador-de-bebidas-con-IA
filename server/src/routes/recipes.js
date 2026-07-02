import { Router } from 'express'
import { z } from 'zod'
import { Op } from 'sequelize'
import { Recipe, Category, Rating, User, Favorite, Ingredient, RecipeIngredient } from '../models/index.js'
import { authenticate, requireOwner } from '../middleware/auth.js'

const router = Router()

const recipeSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  ingredients: z.array(z.string()).min(1),
  instructions: z.string().min(10),
  imageUrl: z.string().optional(),
  categoryId: z.string().uuid(),
  costPrice: z.number().min(0).optional(),
  suggestedPrice: z.number().min(0).optional(),
  profitMargin: z.number().optional(),
  laborCost: z.number().min(0).optional(),
  recipeIngredients: z.array(z.object({
    ingredientId: z.string().uuid(),
    quantity: z.number().min(0),
  })).optional(),
})

const recipeIncludes = [
  { model: Category, attributes: ['id', 'name', 'type'] },
  { model: User, attributes: ['id', 'name'] },
  { model: RecipeIngredient, include: [{ model: Ingredient, attributes: ['id', 'name', 'unit', 'unitPrice'] }] },
]

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query
    const where = {}

    if (category) where.categoryId = category
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` }
    }

    const recipes = await Recipe.findAll({
      where,
      include: recipeIncludes,
      order: [['createdAt', 'DESC']],
    })

    const recipesWithCount = await Promise.all(
      recipes.map(async (recipe) => {
        const favoriteCount = await Favorite.count({ where: { recipeId: recipe.id } })
        return { ...recipe.toJSON(), favoriteCount }
      })
    )

    res.json(recipesWithCount)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id, {
      include: [
        ...recipeIncludes,
        { model: Rating, include: [{ model: User, attributes: ['id', 'name'] }] },
      ],
    })
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })

    const result = recipe.toJSON()
    result.favoriteCount = await Favorite.count({ where: { recipeId: recipe.id } })

    if (req.headers.authorization) {
      try {
        const jwt = (await import('jsonwebtoken')).default
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const fav = await Favorite.findOne({
          where: { userId: decoded.id, recipeId: recipe.id },
        })
        result.isFavorited = !!fav
      } catch {
        result.isFavorited = false
      }
    } else {
      result.isFavorited = false
    }

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, requireOwner, async (req, res) => {
  try {
    const data = recipeSchema.parse(req.body)
    const { recipeIngredients, ...recipeData } = data

    const recipe = await Recipe.create({
      ...recipeData,
      userId: req.user.id,
    })

    if (recipeIngredients && recipeIngredients.length > 0) {
      await RecipeIngredient.bulkCreate(
        recipeIngredients.map(ri => ({ ...ri, recipeId: recipe.id }))
      )
      await calculateRecipeCost(recipe.id)
    }

    const full = await Recipe.findByPk(recipe.id, {
      include: recipeIncludes,
    })
    res.status(201).json(full)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, requireOwner, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id)
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
    if (recipe.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const data = recipeSchema.partial().parse(req.body)
    const { recipeIngredients, ...recipeData } = data
    await recipe.update(recipeData)

    if (recipeIngredients) {
      await RecipeIngredient.destroy({ where: { recipeId: recipe.id } })
      await RecipeIngredient.bulkCreate(
        recipeIngredients.map(ri => ({ ...ri, recipeId: recipe.id }))
      )
      await calculateRecipeCost(recipe.id)
    }

    const updated = await Recipe.findByPk(recipe.id, {
      include: recipeIncludes,
    })
    res.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, requireOwner, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id)
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
    if (recipe.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    await RecipeIngredient.destroy({ where: { recipeId: recipe.id } })
    await recipe.destroy()
    res.json({ message: 'Recipe deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/calculate-cost', authenticate, requireOwner, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id)
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
    if (recipe.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const result = await calculateRecipeCost(recipe.id)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

async function calculateRecipeCost(recipeId) {
  const recipe = await Recipe.findByPk(recipeId, {
    include: [{ model: RecipeIngredient, include: [Ingredient] }],
  })
  if (!recipe) return null

  const recipeIngredients = recipe.RecipeIngredients || []
  let totalIngredientCost = 0

  for (const ri of recipeIngredients) {
    if (ri.Ingredient) {
      totalIngredientCost += ri.quantity * ri.Ingredient.unitPrice
    }
  }

  const laborCost = recipe.laborCost || 0
  const costPrice = Math.round((totalIngredientCost + laborCost) * 100) / 100
  const suggestedPrice = costPrice > 0
    ? Math.round(costPrice * 2.5 * 100) / 100
    : 0
  const profitMargin = suggestedPrice > 0
    ? Math.round(((suggestedPrice - costPrice) / suggestedPrice) * 100 * 100) / 100
    : 0

  await recipe.update({ costPrice, suggestedPrice, profitMargin })

  return { costPrice, suggestedPrice, profitMargin, ingredientCost: totalIngredientCost, laborCost }
}

export default router

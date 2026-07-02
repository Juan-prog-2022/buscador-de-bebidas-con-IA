import { Router } from 'express'
import { z } from 'zod'
import { InventoryItem, Ingredient, RecipeIngredient, Recipe } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const inventorySchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.number().min(0),
  minStock: z.number().min(0).optional(),
})

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: { userId: req.user.id },
      include: [Ingredient],
      order: [[Ingredient, 'name', 'ASC']],
    })
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/low-stock', authenticate, async (req, res) => {
  try {
    const items = await InventoryItem.findAll({
      where: { userId: req.user.id },
      include: [Ingredient],
    })
    const lowStock = items.filter((item) => item.minStock > 0 && item.quantity <= item.minStock)
    res.json(lowStock)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/check-recipe/:recipeId', authenticate, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.recipeId, {
      include: [{ model: RecipeIngredient, include: [Ingredient] }],
    })
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })

    const recipeIngredients = recipe.RecipeIngredients || []
    const inventoryItems = await InventoryItem.findAll({
      where: { userId: req.user.id },
      include: [Ingredient],
    })

    const availability = recipeIngredients.map((ri) => {
      const inv = inventoryItems.find((i) => i.ingredientId === ri.ingredientId)
      const needed = ri.quantity
      const available = inv ? inv.quantity : 0
      return {
        ingredientId: ri.ingredientId,
        ingredientName: ri.Ingredient?.name || 'Unknown',
        needed,
        available,
        sufficient: available >= needed,
        unit: ri.Ingredient?.unit || '',
      }
    })

    const allAvailable = availability.every((a) => a.sufficient)

    res.json({ allAvailable, items: availability })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const data = inventorySchema.parse(req.body)
    const existing = await InventoryItem.findOne({
      where: { ingredientId: data.ingredientId, userId: req.user.id },
    })
    if (existing) {
      await existing.update({ quantity: data.quantity, minStock: data.minStock ?? existing.minStock })
      return res.json(existing)
    }
    const item = await InventoryItem.create({ ...data, userId: req.user.id })
    const full = await InventoryItem.findByPk(item.id, { include: [Ingredient] })
    res.status(201).json(full)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findOne({ where: { id: req.params.id, userId: req.user.id } })
    if (!item) return res.status(404).json({ error: 'Inventory item not found' })

    const data = inventorySchema.partial().parse(req.body)
    await item.update(data)
    const full = await InventoryItem.findByPk(item.id, { include: [Ingredient] })
    res.json(full)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/adjust', authenticate, async (req, res) => {
  try {
    const { quantity, operation } = z.object({
      quantity: z.number().min(0),
      operation: z.enum(['add', 'remove', 'set']),
    }).parse(req.body)

    const item = await InventoryItem.findOne({ where: { id: req.params.id, userId: req.user.id } })
    if (!item) return res.status(404).json({ error: 'Inventory item not found' })

    let newQuantity = item.quantity
    switch (operation) {
      case 'add':
        newQuantity = item.quantity + quantity
        break
      case 'remove':
        newQuantity = Math.max(0, item.quantity - quantity)
        break
      case 'set':
        newQuantity = quantity
        break
    }

    await item.update({ quantity: newQuantity })
    const full = await InventoryItem.findByPk(item.id, { include: [Ingredient] })
    res.json(full)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findOne({ where: { id: req.params.id, userId: req.user.id } })
    if (!item) return res.status(404).json({ error: 'Inventory item not found' })
    await item.destroy()
    res.json({ message: 'Inventory item deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

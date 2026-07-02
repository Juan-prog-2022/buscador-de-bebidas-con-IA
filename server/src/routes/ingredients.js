import { Router } from 'express'
import { z } from 'zod'
import { Ingredient } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const ingredientSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  unitPrice: z.number().min(0),
  category: z.string().optional(),
})

router.get('/', authenticate, async (req, res) => {
  try {
    const ingredients = await Ingredient.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']],
    })
    res.json(ingredients)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const data = ingredientSchema.parse(req.body)
    const ingredient = await Ingredient.create({
      ...data,
      userId: req.user.id,
    })
    res.status(201).json(ingredient)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authenticate, async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      where: { id: req.params.id, userId: req.user.id },
    })
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' })

    const data = ingredientSchema.partial().parse(req.body)
    await ingredient.update(data)
    res.json(ingredient)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      where: { id: req.params.id, userId: req.user.id },
    })
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' })
    await ingredient.destroy()
    res.json({ message: 'Ingredient deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

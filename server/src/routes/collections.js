import { Router } from 'express'
import { z } from 'zod'
import { Collection, RecipeCollection, Recipe, Category, User } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const collectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
})

router.get('/', async (req, res) => {
  try {
    const where = {}
    if (req.headers.authorization) {
      try {
        const jwt = (await import('jsonwebtoken')).default
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        where.userId = decoded.id
      } catch {
        where.isPublic = true
      }
    } else {
      where.isPublic = true
    }

    const collections = await Collection.findAll({
      where,
      include: [{
        model: Recipe,
        as: 'recipes',
        attributes: ['id', 'name', 'imageUrl'],
        through: { attributes: ['order'] },
      }, { model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    })
    res.json(collections)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/public', async (_req, res) => {
  try {
    const collections = await Collection.findAll({
      where: { isPublic: true },
      include: [{
        model: Recipe,
        as: 'recipes',
        attributes: ['id', 'name', 'imageUrl'],
        through: { attributes: ['order'] },
      }, { model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    })
    res.json(collections)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findByPk(req.params.id, {
      include: [{
        model: Recipe,
        as: 'recipes',
        include: [
          { model: Category, attributes: ['id', 'name', 'type'] },
          { model: User, attributes: ['id', 'name'] },
        ],
        through: { attributes: ['order'] },
      }, { model: User, attributes: ['id', 'name'] }],
    })
    if (!collection) return res.status(404).json({ error: 'Collection not found' })
    res.json(collection)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const data = collectionSchema.parse(req.body)
    const collection = await Collection.create({ ...data, userId: req.user.id })
    const full = await Collection.findByPk(collection.id, {
      include: [{ model: Recipe, as: 'recipes' }],
    })
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
    const collection = await Collection.findOne({ where: { id: req.params.id, userId: req.user.id } })
    if (!collection) return res.status(404).json({ error: 'Collection not found' })

    const data = collectionSchema.partial().parse(req.body)
    await collection.update(data)
    res.json(collection)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const collection = await Collection.findOne({ where: { id: req.params.id, userId: req.user.id } })
    if (!collection) return res.status(404).json({ error: 'Collection not found' })
    await RecipeCollection.destroy({ where: { collectionId: collection.id } })
    await collection.destroy()
    res.json({ message: 'Collection deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/recipes/:recipeId', authenticate, async (req, res) => {
  try {
    const collection = await Collection.findOne({ where: { id: req.params.id, userId: req.user.id } })
    if (!collection) return res.status(404).json({ error: 'Collection not found' })

    const existing = await RecipeCollection.findOne({
      where: { collectionId: req.params.id, recipeId: req.params.recipeId },
    })
    if (existing) return res.status(400).json({ error: 'Recipe already in collection' })

    const maxOrder = await RecipeCollection.max('order', { where: { collectionId: req.params.id } })
    await RecipeCollection.create({
      collectionId: req.params.id,
      recipeId: req.params.recipeId,
      order: (maxOrder || 0) + 1,
    })
    res.status(201).json({ message: 'Recipe added to collection' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/recipes/:recipeId', authenticate, async (req, res) => {
  try {
    const collection = await Collection.findOne({ where: { id: req.params.id, userId: req.user.id } })
    if (!collection) return res.status(404).json({ error: 'Collection not found' })

    await RecipeCollection.destroy({
      where: { collectionId: req.params.id, recipeId: req.params.recipeId },
    })
    res.json({ message: 'Recipe removed from collection' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

import { Router } from 'express'
import { Category } from '../models/Category.js'
import { authenticate, requireOwner } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] })
    res.json(categories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', authenticate, requireOwner, async (req, res) => {
  try {
    const { name, type, description } = req.body
    const category = await Category.create({ name, type, description })
    res.status(201).json(category)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

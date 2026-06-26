import { Router } from 'express'
import { z } from 'zod'
import { Rating, Recipe, User } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'
import { Op, Sequelize } from 'sequelize'

const router = Router()

const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

router.post('/:recipeId', authenticate, async (req, res) => {
  try {
    const { score, comment } = ratingSchema.parse(req.body)
    const recipe = await Recipe.findByPk(req.params.recipeId)
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })

    const existing = await Rating.findOne({
      where: { recipeId: req.params.recipeId, userId: req.user.id },
    })
    if (existing) {
      return res.status(400).json({ error: 'You already rated this recipe' })
    }

    await Rating.create({
      score,
      comment,
      recipeId: req.params.recipeId,
      userId: req.user.id,
    })

    const result = await Rating.findAll({
      where: { recipeId: req.params.recipeId },
      attributes: [[Sequelize.fn('AVG', Sequelize.col('score')), 'avg']],
    })
    const avg = parseFloat(result[0].dataValues.avg).toFixed(1)
    await recipe.update({ averageRating: avg })

    const rating = await Rating.findOne({
      where: { recipeId: req.params.recipeId, userId: req.user.id },
      include: [{ model: User, attributes: ['id', 'name'] }],
    })
    res.status(201).json(rating)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/:recipeId', async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      where: { recipeId: req.params.recipeId },
      include: [{ model: User, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    })
    res.json(ratings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

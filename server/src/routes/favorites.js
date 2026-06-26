import { Router } from 'express'
import { Recipe, Favorite, Category, User } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Recipe,
        include: [
          { model: Category, attributes: ['id', 'name', 'type'] },
          { model: User, attributes: ['id', 'name'] },
        ],
      }],
      order: [['createdAt', 'DESC']],
    })
    const recipes = favorites.map((f) => f.Recipe)
    res.json(recipes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:recipeId', authenticate, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.recipeId)
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })

    const [, created] = await Favorite.findOrCreate({
      where: { userId: req.user.id, recipeId: req.params.recipeId },
      defaults: { userId: req.user.id, recipeId: req.params.recipeId },
    })

    if (!created) {
      return res.status(400).json({ error: 'Already in favorites' })
    }

    res.status(201).json({ message: 'Added to favorites' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:recipeId', authenticate, async (req, res) => {
  try {
    const deleted = await Favorite.destroy({
      where: { userId: req.user.id, recipeId: req.params.recipeId },
    })
    if (!deleted) return res.status(404).json({ error: 'Favorite not found' })
    res.json({ message: 'Removed from favorites' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

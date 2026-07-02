import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pc from 'picocolors'
import { connectDB, sequelize } from './config/database.js'
import authRoutes from './routes/auth.js'
import recipeRoutes from './routes/recipes.js'
import ratingRoutes from './routes/ratings.js'
import aiRoutes from './routes/ai.js'
import categoryRoutes from './routes/categories.js'
import favoriteRoutes from './routes/favorites.js'
import imageRoutes from './routes/images.js'
import ingredientRoutes from './routes/ingredients.js'
import collectionRoutes from './routes/collections.js'
import inventoryRoutes from './routes/inventory.js'
import analyticsRoutes from './routes/analytics.js'
import menuRoutes from './routes/menu.js'
import recommendationRoutes from './routes/recommendations.js'
import './models/index.js'
import { requestLogger } from './middleware/logger.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.use('/api/auth', authRoutes)
app.use('/api/recipes', recipeRoutes)
app.use('/api/ratings', ratingRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/images', imageRoutes)
app.use('/api/ingredients', ingredientRoutes)
app.use('/api/collections', collectionRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/recommendations', recommendationRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

async function start() {
  console.log(pc.cyan('━'.repeat(40)))
  console.log(pc.bold(pc.yellow(' 🍸 Sabores con IA - Backend')))
  console.log(pc.cyan('━'.repeat(40)))
  await connectDB()
  await sequelize.sync()
  app.listen(PORT, () => {
    console.log(pc.green('✓'), pc.bold(`Server running on`), pc.underline(`http://localhost:${PORT}`))
    console.log(pc.dim(`Mode: ${process.env.NODE_ENV || 'development'}`))
    console.log(pc.cyan('━'.repeat(40)))
  })
}

start()

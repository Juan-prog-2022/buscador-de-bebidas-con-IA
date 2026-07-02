import { Router } from 'express'
import { z } from 'zod'
import dotenv from 'dotenv'
import { Recipe, Category } from '../models/index.js'

dotenv.config()
const router = Router()

const searchSchema = z.object({
  q: z.string().min(2),
  count: z.coerce.number().int().min(1).max(20).optional().default(10),
})

router.get('/search', async (req, res) => {
  try {
    const { q, count } = searchSchema.parse(req.query)
    const query = encodeURIComponent(q)

    const apiKey = process.env.UNSPLASH_ACCESS_KEY

    if (apiKey) {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=${count}&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${apiKey}` } }
      )

      if (!response.ok) throw new Error('Unsplash API error')

      const data = await response.json()
      const images = data.results.map((img) => ({
        id: img.id,
        url: `${img.urls.raw}&w=800&h=500&fit=crop`,
        thumb: `${img.urls.thumb}`,
        small: `${img.urls.small}`,
        credit: img.user.name,
        creditUrl: img.links.html,
        alt: img.alt_description || q,
      }))

      return res.json({ images, total: data.total })
    }

    const images = Array.from({ length: count }, (_, i) => ({
      id: `placeholder-${i}`,
      url: `https://picsum.photos/seed/${query}-${i}/800/500`,
      thumb: `https://picsum.photos/seed/${query}-${i}/200/150`,
      small: `https://picsum.photos/seed/${query}-${i}/400/250`,
      credit: 'Picsum Photos',
      creditUrl: 'https://picsum.photos',
      alt: q,
    }))
    res.json({ images, total: count })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/social-card/:recipeId', async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.recipeId, {
      include: [{ model: Category, attributes: ['name', 'type'] }],
    })
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })

    const r = recipe.toJSON()
    const price = r.suggestedPrice || 0
    const rating = r.averageRating || 0

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${r.name} - Sabores con IA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #f0f0f0;
    }
    .card {
      width: 600px; background: white; border-radius: 24px;
      overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    .card-image {
      height: 320px; background: linear-gradient(135deg, #4338ca, #6d28d9);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    .card-image img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .card-image .emoji-bg {
      font-size: 120px; opacity: 0.3; position: absolute;
    }
    .card-badge {
      position: absolute; top: 20px; left: 20px;
      background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
      padding: 8px 16px; border-radius: 100px;
      font-size: 13px; font-weight: 600; color: #4338ca;
    }
    .card-body { padding: 28px 32px; }
    .card-title {
      font-size: 28px; font-weight: 800; color: #1e1e2e;
      margin-bottom: 8px;
    }
    .card-desc {
      font-size: 15px; color: #6b7280; line-height: 1.5;
      margin-bottom: 20px;
    }
    .card-meta {
      display: flex; gap: 24px; padding: 16px 0;
      border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;
      margin-bottom: 20px;
    }
    .card-meta-item { text-align: center; flex: 1; }
    .card-meta-value {
      font-size: 20px; font-weight: 700; color: #1e1e2e;
    }
    .card-meta-label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
      color: #9ca3af; margin-top: 2px;
    }
    .card-ingredients {
      display: flex; flex-wrap: wrap; gap: 8px;
    }
    .card-ingredient {
      background: #f5f3ff; color: #4338ca;
      padding: 6px 14px; border-radius: 100px;
      font-size: 13px; font-weight: 500;
    }
    .card-footer {
      margin-top: 20px; padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .card-brand {
      font-size: 14px; font-weight: 700; color: #4338ca;
    }
    .card-brand span { color: #9ca3af; font-weight: 400; }
    .card-url {
      font-size: 11px; color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-image">
      ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.name}"/>` : `<div class="emoji-bg">🍸</div>`}
      <div class="card-badge">${r.Category?.name || 'Receta'}</div>
    </div>
    <div class="card-body">
      <h1 class="card-title">${r.name}</h1>
      ${r.description ? `<p class="card-desc">${r.description}</p>` : ''}
      <div class="card-meta">
        ${price > 0 ? `<div class="card-meta-item"><div class="card-meta-value">$${price.toFixed(2)}</div><div class="card-meta-label">Precio</div></div>` : ''}
        ${rating > 0 ? `<div class="card-meta-item"><div class="card-meta-value">${'★'.repeat(Math.round(rating))}</div><div class="card-meta-label">${rating.toFixed(1)}</div></div>` : ''}
        <div class="card-meta-item"><div class="card-meta-value">${r.ingredients?.length || 0}</div><div class="card-meta-label">Ingredientes</div></div>
      </div>
      ${r.ingredients ? `<div class="card-ingredients">${r.ingredients.slice(0, 8).map(i => `<span class="card-ingredient">${i}</span>`).join('')}</div>` : ''}
      <div class="card-footer">
        <div class="card-brand">Sabores <span>con IA</span></div>
        <div class="card-url">${req.headers.host || 'saboresconia.com'}/recipes/${r.id}</div>
      </div>
    </div>
  </div>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

import { Router } from 'express'
import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()
const router = Router()

const searchSchema = z.object({
  q: z.string().min(2),
})

router.get('/search', async (req, res) => {
  try {
    const { q } = searchSchema.parse(req.query)
    const query = encodeURIComponent(q)

    const apiKey = process.env.UNSPLASH_ACCESS_KEY

    if (apiKey) {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=5&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${apiKey}` } }
      )

      if (!response.ok) throw new Error('Unsplash API error')

      const data = await response.json()
      const images = data.results.map((img) => ({
        url: `${img.urls.raw}&w=600&h=400&fit=crop`,
        thumb: `${img.urls.thumb}`,
        credit: img.user.name,
        creditUrl: img.links.html,
      }))

      return res.json({ images })
    }

    const images = [
      { url: `https://source.unsplash.com/600x400/?${query}&sig=1` },
      { url: `https://source.unsplash.com/600x400/?${query}&sig=2` },
      { url: `https://source.unsplash.com/600x400/?${query}&sig=3` },
    ]
    res.json({ images })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

export default router

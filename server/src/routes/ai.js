import { Router } from 'express'
import { z } from 'zod'
import dotenv from 'dotenv'
import { authenticate } from '../middleware/auth.js'

dotenv.config()
const router = Router()

const promptSchema = z.object({
  prompt: z.string().min(3),
  type: z.enum(['drink', 'dessert', 'general']).optional(),
  count: z.number().int().min(1).max(10).optional().default(5),
})

router.post('/recommend', authenticate, async (req, res) => {
  try {
    const { prompt, type, count } = promptSchema.parse(req.body)

    const systemPrompt = type
      ? `Eres un experto en coctelería y gastronomía. Recomienda ${count} ${type === 'drink' ? 'bebidas' : type === 'dessert' ? 'postres' : 'productos'} basados en: "${prompt}". Responde SOLO con un array JSON donde cada item tiene: name (string), description (string), ingredients (array de strings), instructions (string).`
      : `Eres un experto en coctelería y gastronomía. Recomienda ${count} productos basados en: "${prompt}". Responde SOLO con un array JSON donde cada item tiene: name (string), description (string), ingredients (array de strings), instructions (string).`

    const apiUrl = process.env.AI_API_URL
    const apiKey = process.env.AI_API_KEY

    if (!apiKey || apiKey === 'sk-placeholder') {
      return res.status(400).json({
        error: 'AI API key not configured. Set AI_API_KEY in .env',
        placeholder: true,
        mock: generateMockRecommendations(prompt, type, count),
      })
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(502).json({
        error: 'AI API error',
        details: text,
        mock: generateMockRecommendations(prompt, type, count),
      })
    }

    const data = await response.json()
    let recommendations

    try {
      const content = data.choices[0].message.content
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      recommendations = JSON.parse(cleaned)
    } catch {
      return res.status(502).json({
        error: 'Failed to parse AI response',
        raw: data.choices[0].message.content,
      })
    }

    res.json({ recommendations })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

function generateMockRecommendations(prompt, type, count) {
  const templates = {
    drink: [
      { name: 'Mocktail Tropical', description: `Refrescante bebida tropical inspirada en "${prompt}"`, ingredients: ['Jugo de piña', 'Jugo de naranja', 'Granadina', 'Hielo', 'Rodaja de naranja'], instructions: 'Mezclar todos los jugos con hielo en una coctelera. Agitar vigorosamente. Servir en vaso alto y decorar con rodaja de naranja.' },
      { name: 'Limonada de Lavanda', description: `Limonada artesanal con toque de lavanda - "${prompt}"`, ingredients: ['Limones frescos', 'Jarabe de lavanda', 'Agua mineral', 'Hielo', 'Ramas de lavanda'], instructions: 'Exprimir los limones. Mezclar el jugo con jarabe de lavanda y agua mineral. Servir con hielo y decorar con ramas de lavanda.' },
    ],
    dessert: [
      { name: 'Tarta de la Casa', description: `Postre especial inspirado en "${prompt}"`, ingredients: ['Masa quebrada', 'Crema pastelera', 'Frutas frescas', 'Azúcar glas', 'Canela'], instructions: 'Preparar la masa quebrada y hornear. Rellenar con crema pastelera. Decorar con frutas frescas y espolvorear azúcar glas.' },
      { name: 'Mousse de Chocolate', description: `Mousse cremoso de chocolate - "${prompt}"`, ingredients: ['Chocolate negro 70%', 'Huevos', 'Azúcar', 'Nata para montar', 'Mantequilla'], instructions: 'Derretir el chocolate al baño maría. Separar claras y yemas. Montar las claras a punto de nieve. Incorporar con movimientos envolventes. Refrigerar 4 horas.' },
    ],
    general: [
      { name: 'Tabla de Quesos', description: `Selección de quesos artesanales sugerida por "${prompt}"`, ingredients: ['Queso manchego', 'Queso azul', 'Brie', 'Uvas', 'Nueces', 'Miel'], instructions: 'Seleccionar 3-4 quesos a temperatura ambiente. Servir con uvas, nueces y un hilo de miel. Acompañar con pan crujiente.' },
      { name: 'Wrap Mediterráneo', description: `Wrap saludable inspirado en "${prompt}"`, ingredients: ['Tortilla de trigo', 'Hummus', 'Pepino', 'Tomate', 'Lechuga', 'Queso feta'], instructions: 'Extender hummus sobre la tortilla. Agregar vegetales en tiras y queso feta desmenuzado. Enrollar firmemente y cortar en diagonal.' },
    ],
  }

  const pool = templates[type] || templates.general
  const result = []
  for (let i = 0; i < Math.min(count, pool.length * 2); i++) {
    const base = pool[i % pool.length]
    result.push({
      ...base,
      name: `${base.name} ${i + 1}`,
      ingredients: base.ingredients,
    })
  }
  return result.slice(0, count)
}

export default router

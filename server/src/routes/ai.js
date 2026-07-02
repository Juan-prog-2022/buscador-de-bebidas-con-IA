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

router.post('/profitability-suggestions', authenticate, async (req, res) => {
  try {
    const { menuData } = z.object({
      menuData: z.array(z.object({
        name: z.string(),
        costPrice: z.number(),
        sellingPrice: z.number(),
        margin: z.number(),
        category: z.string(),
      })),
    }).parse(req.body)

    const avgMargin = menuData.length > 0
      ? menuData.reduce((s, r) => s + r.margin, 0) / menuData.length
      : 0

    const systemPrompt = `Eres un consultor experto en rentabilidad para bares y restaurantes. 
Analiza este menú y da recomendaciones para mejorar la rentabilidad.

DATOS DEL MENÚ:
${menuData.map(r => `- ${r.name}: costo $${r.costPrice}, precio $${r.sellingPrice}, margen ${r.margin.toFixed(1)}%, categoría: ${r.category}`).join('\n')}

Promedio de margen: ${avgMargin.toFixed(1)}%

Responde SOLO con un array JSON donde cada item tiene:
- type (string): "price", "cost", "menu", "promotion", or "strategy"
- title (string): título corto
- description (string): explicación detallada
- priority (string): "alta", "media", or "baja"
- expectedImpact (string): impacto esperado`

    const apiKey = process.env.AI_API_KEY
    const apiUrl = process.env.AI_API_URL

    if (!apiKey || apiKey === 'sk-placeholder') {
      return res.json({
        placeholder: true,
        suggestions: generateMockSuggestions(menuData, avgMargin),
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
          { role: 'user', content: 'Analiza este menú y dame recomendaciones para mejorar la rentabilidad.' },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      return res.json({
        error: 'AI API error',
        suggestions: generateMockSuggestions(menuData, avgMargin),
      })
    }

    const data = await response.json()
    let suggestions

    try {
      const content = data.choices[0].message.content
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      suggestions = JSON.parse(cleaned)
    } catch {
      suggestions = generateMockSuggestions(menuData, avgMargin)
    }

    res.json({ suggestions })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

function generateMockSuggestions(menuData, avgMargin) {
  const suggestions = []

  const lowMargin = menuData.filter(r => r.margin < 30)
  if (lowMargin.length > 0) {
    suggestions.push({
      type: 'price',
      title: 'Aumentar precios de productos con bajo margen',
      description: `${lowMargin.length} producto${lowMargin.length > 1 ? 's' : ''} tiene${lowMargin.length === 1 ? 'n' : ''} margen bajo: ${lowMargin.map(r => r.name).join(', ')}. Considera aumentar los precios entre 10-20%.`,
      priority: 'alta',
      expectedImpact: 'Aumento del margen general en 5-10 puntos porcentuales',
    })
  }

  const highMargin = menuData.filter(r => r.margin >= 60)
  if (highMargin.length > 0) {
    suggestions.push({
      type: 'menu',
      title: 'Promocionar productos de alto margen',
      description: `${highMargin[0].name} tiene el margen más alto (${highMargin[0].margin.toFixed(1)}%). Promocionarlo como especial o incluirlo en combos puede aumentar la rentabilidad general.`,
      priority: 'alta',
      expectedImpact: 'Mayor tracción en productos rentables',
    })
  }

  if (avgMargin < 40) {
    suggestions.push({
      type: 'cost',
      title: 'Revisar costos de ingredientes',
      description: `El margen promedio (${avgMargin.toFixed(1)}%) está por debajo del 40%. Revisa proveedores y considera compras al por mayor para reducir costos.`,
      priority: 'alta',
      expectedImpact: 'Reducción de costos del 10-15%',
    })
  }

  suggestions.push({
    type: 'strategy',
    title: 'Implementar menú dinámico',
    description: 'Rotar el menú según temporada y disponibilidad de ingredientes. Los platos de temporada suelen tener mejor margen por menor costo de ingredientes.',
    priority: 'media',
    expectedImpact: 'Mejora sostenible de márgenes',
  })

  return suggestions
}

router.post('/image-prompt', authenticate, async (req, res) => {
  try {
    const { recipeName, description, ingredients } = z.object({
      recipeName: z.string().min(1),
      description: z.string().optional(),
      ingredients: z.array(z.string()).optional(),
    }).parse(req.body)

    const systemPrompt = `Eres un experto en fotografIa gastronOmica. Genera 3 terminos de busqueda en ingles para encontrar fotos profesionales de este plato en un banco de imagenes.
Responde SOLO con un array JSON de strings, cada termino debe ser optimo para buscar en Unsplash.
Ejemplo: ["cocktail margarita salt rim lime", "margarita drink sunset bar", "classic margarita cocktail"]`

    const userContent = `Plato: ${recipeName}${description ? `\nDescripcion: ${description}` : ''}${ingredients ? `\nIngredientes: ${ingredients.join(', ')}` : ''}`

    const apiKey = process.env.AI_API_KEY

    if (!apiKey || apiKey === 'sk-placeholder') {
      return res.json({
        queries: [
          `${recipeName} food photography`,
          `${recipeName} restaurant dish`,
          `${recipeName} professional photo`,
        ],
      })
    }

    const response = await fetch(process.env.AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      return res.json({
        queries: [`${recipeName} food`, `${recipeName} drink`, `${recipeName} dish`],
      })
    }

    const data = await response.json()
    let queries

    try {
      const content = data.choices[0].message.content
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      queries = JSON.parse(cleaned)
    } catch {
      queries = [`${recipeName} food photography`]
    }

    res.json({ queries })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.post('/generate-post', authenticate, async (req, res) => {
  try {
    const { recipeName, description, price, category, platform, tone } = z.object({
      recipeName: z.string().min(1),
      description: z.string().optional(),
      price: z.number().optional(),
      category: z.string().optional(),
      platform: z.enum(['instagram', 'facebook', 'twitter', 'whatsapp']).optional().default('instagram'),
      tone: z.enum(['professional', 'casual', 'fun', 'elegant']).optional().default('casual'),
    }).parse(req.body)

    const platformLabels = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      twitter: 'Twitter/X',
      whatsapp: 'WhatsApp',
    }

    const systemPrompt = `Eres un community manager experto en gastronomIa y coctelerIa. 
Genera una publicacion promocional para ${platformLabels[platform]} sobre esta receta.
TONO: ${tone === 'professional' ? 'Profesional y sofisticado' : tone === 'casual' ? 'Casual y cercano' : tone === 'fun' ? 'Divertido y con humor' : 'Elegante y exclusivo'}

Responde SOLO con un objeto JSON con:
- caption (string): texto principal de la publicacion
- hashtags (array de strings): 5-8 hashtags relevantes
- callToAction (string): llamado a la accion
- emojis (array de strings): 3-5 emojis que representen el plato`

    const userContent = `Plato: ${recipeName}${description ? `\nDescripcion: ${description}` : ''}${price ? `\nPrecio: $${price}` : ''}${category ? `\nCategoria: ${category}` : ''}`

    const apiKey = process.env.AI_API_KEY

    if (!apiKey || apiKey === 'sk-placeholder') {
      return res.json({
        post: generateMockPost(recipeName, platform, tone),
        platform,
      })
    }

    const response = await fetch(process.env.AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      return res.json({
        post: generateMockPost(recipeName, platform, tone),
      })
    }

    const data = await response.json()
    let post

    try {
      const content = data.choices[0].message.content
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      post = JSON.parse(cleaned)
    } catch {
      post = generateMockPost(recipeName, platform, tone)
    }

    res.json({ post, platform })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

function generateMockPost(recipeName, platform, tone) {
  const tones = {
    casual: {
      captions: [
        `¡Probá hoy nuestro ${recipeName}! Hecho con amor y los mejores ingredientes. 🍸`,
        `${recipeName} — la receta que tenés que probar. Te va a encantar. 🔥`,
        `¿Ya probaste nuestro ${recipeName}? Te esperamos. 👌`,
      ],
      cta: '¡Pedilo ya!',
    },
    fun: {
      captions: [
        `${recipeName} → tu felicidad en un vaso/plato. No discutas con la ciencia. 🧪🍸`,
        `Si no probaste el ${recipeName}, ¿qué estás haciendo con tu vida? 🔥😂`,
        `${recipeName}: tan bueno que debería ser ilegal. Casi. 😏`,
      ],
      cta: 'Dale, convencete. 😎',
    },
    elegant: {
      captions: [
        `${recipeName}. Una experiencia que trasciende lo cotidiano. ✨`,
        `Descubrí la exquisitez de nuestro ${recipeName}. Arte en cada preparación. 🎭`,
        `${recipeName}: donde la tradición se encuentra con la innovación. 🌟`,
      ],
      cta: 'Reservá tu experiencia.',
    },
    professional: {
      captions: [
        `Presentamos ${recipeName}. Elaborado con ingredientes seleccionados y técnica impecable.`,
        `${recipeName} — un clásico reinventado por nuestro equipo de expertos.`,
        `Degustá ${recipeName}. Cada detalle está cuidado al máximo.`,
      ],
      cta: 'Consultanos por nuestra carta.',
    },
  }

  const t = tones[tone] || tones.casual
  const caption = t.captions[Math.floor(Math.random() * t.captions.length)]

  const hashtags = ['#SaboresConIA', `#${recipeName.replace(/\s+/g, '')}`, '#Gastronomia', '#BarTrendy', '#Cocteleria', '#MomentoPerfecto']

  return {
    caption,
    hashtags,
    callToAction: t.cta,
    emojis: ['🍸', '✨', '🔥'],
  }
}

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

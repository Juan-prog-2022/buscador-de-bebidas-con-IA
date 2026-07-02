import { Router } from 'express'
import { z } from 'zod'
import { BusinessProfile, Recipe, Category, User } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const profileSchema = z.object({
  businessName: z.string().optional(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  welcomeMessage: z.string().optional(),
  isActive: z.boolean().optional(),
})

router.get('/profile', authenticate, async (req, res) => {
  try {
    let profile = await BusinessProfile.findOne({ where: { userId: req.user.id } })
    if (!profile) {
      const user = await User.findByPk(req.user.id)
      profile = await BusinessProfile.create({
        userId: req.user.id,
        businessName: user?.name || 'Mi Bar',
      })
    }
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/profile', authenticate, async (req, res) => {
  try {
    const data = profileSchema.parse(req.body)
    const [profile] = await BusinessProfile.findOrCreate({
      where: { userId: req.user.id },
      defaults: { userId: req.user.id, businessName: 'Mi Bar' },
    })
    await profile.update(data)
    res.json(profile)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/public/:userId', async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({
      where: { userId: req.params.userId, isActive: true },
    })
    if (!profile) return res.status(404).json({ error: 'Menu not found' })

    const recipes = await Recipe.findAll({
      where: { userId: req.params.userId },
      include: [{ model: Category, attributes: ['id', 'name', 'type'] }],
      order: [['createdAt', 'DESC']],
    })

    const grouped = recipes.reduce((acc, r) => {
      const type = r.Category?.type || 'general'
      const typeLabel = { drink: '🍸 Bebidas', dessert: '🍰 Postres', general: '🍽️ General' }[type] || 'General'
      if (!acc[typeLabel]) {
        acc[typeLabel] = { type, label: typeLabel, items: [] }
      }
      acc[typeLabel].items.push({
        id: r.id,
        name: r.name,
        description: r.description,
        price: r.suggestedPrice || 0,
        imageUrl: r.imageUrl,
        ingredients: r.ingredients,
      })
      return acc
    }, {})

    res.json({
      business: {
        name: profile.businessName,
        logo: profile.logo,
        primaryColor: profile.primaryColor,
        accentColor: profile.accentColor,
        welcomeMessage: profile.welcomeMessage,
      },
      categories: Object.values(grouped),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/view/:userId', async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({
      where: { userId: req.params.userId, isActive: true },
    })
    if (!profile) return res.status(404).send('<h1>Menú no disponible</h1>')

    const recipes = await Recipe.findAll({
      where: { userId: req.params.userId },
      include: [{ model: Category, attributes: ['id', 'name', 'type'] }],
      order: [['createdAt', 'DESC']],
    })

    const grouped = recipes.reduce((acc, r) => {
      const type = r.Category?.type || 'general'
      const typeLabel = { drink: 'Bebidas', dessert: 'Postres', general: 'Platos' }[type] || 'General'
      if (!acc[typeLabel]) acc[typeLabel] = []
      acc[typeLabel].push(r)
      return acc
    }, {})

    const typeEmoji = { drink: '🍸', dessert: '🍰', general: '🍽️' }
    const typeIcon = { drink: '🍸', dessert: '🍰', general: '🍽️' }

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>${profile.businessName} - Menú Digital</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #f8f7ff;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, ${profile.primaryColor || '#4338ca'}, ${profile.accentColor || '#6d28d9'});
      color: white;
      padding: 40px 20px 30px;
      text-align: center;
    }
    .header h1 { font-size: 28px; font-weight: 800; }
    .header p { font-size: 14px; opacity: 0.9; margin-top: 8px; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.5; }
    .header .emoji-header { font-size: 48px; margin-bottom: 8px; }
    .content { max-width: 600px; margin: 0 auto; padding: 20px 16px 40px; }
    .category { margin-bottom: 28px; }
    .category-title {
      font-size: 20px; font-weight: 700; color: ${profile.primaryColor || '#4338ca'};
      margin-bottom: 12px; padding-bottom: 8px;
      border-bottom: 2px solid ${profile.primaryColor || '#4338ca'}20;
      display: flex; align-items: center; gap: 8px;
    }
    .item {
      background: white; border-radius: 14px; padding: 14px 16px;
      margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      display: flex; gap: 12px;
    }
    .item-img {
      width: 64px; height: 64px; border-radius: 10px; object-fit: cover;
      background: #f0f0f0; flex-shrink: 0;
    }
    .item-img-placeholder {
      width: 64px; height: 64px; border-radius: 10px;
      background: linear-gradient(135deg, ${profile.primaryColor || '#4338ca'}20, ${profile.accentColor || '#6d28d9'}10);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; flex-shrink: 0;
    }
    .item-info { flex: 1; min-width: 0; }
    .item-name { font-weight: 600; color: #1e1e2e; font-size: 15px; }
    .item-desc { font-size: 12px; color: #6b7280; margin-top: 2px; line-height: 1.4; }
    .item-price {
      font-weight: 700; color: ${profile.primaryColor || '#4338ca'};
      font-size: 16px; text-align: right; white-space: nowrap; margin-left: 8px;
    }
    .footer {
      text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;
    }
    .footer span { color: ${profile.primaryColor || '#4338ca'}; font-weight: 600; }
    @media (max-width: 400px) {
      .header h1 { font-size: 22px; }
      .item { padding: 10px 12px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="emoji-header">${profile.logo ? `<img src="${profile.logo}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">` : '🍽️'}</div>
    <h1>${profile.businessName}</h1>
    ${profile.welcomeMessage ? `<p>${profile.welcomeMessage}</p>` : ''}
  </div>
  <div class="content">
    ${Object.entries(grouped).map(([label, items]) => `
      <div class="category">
        <h2 class="category-title">${typeEmoji[label] || '🍽️'} ${label}</h2>
        ${items.map(r => `
          <div class="item">
            ${r.imageUrl
              ? `<img src="${r.imageUrl}" alt="${r.name}" class="item-img" loading="lazy">`
              : `<div class="item-img-placeholder">${typeIcon[label] || '🍽️'}</div>`
            }
            <div class="item-info">
              <div class="item-name">${r.name}</div>
              ${r.description ? `<div class="item-desc">${r.description}</div>` : ''}
            </div>
            ${r.suggestedPrice ? `<div class="item-price">$${Number(r.suggestedPrice).toFixed(2)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>
  <div class="footer">
    Powered by <span>Sabores con IA</span>
  </div>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (err) {
    res.status(500).send('<h1>Error al cargar el menú</h1>')
  }
})

router.get('/qr/:userId', authenticate, async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({
      where: { userId: req.user.id, isActive: true },
    })
    if (!profile) return res.status(404).json({ error: 'Menu not active' })

    const menuUrl = `${req.protocol}://${req.get('host')}/api/menu/view/${req.user.id}`

    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuUrl)}`

    const response = await fetch(qrApi)
    if (!response.ok) {
      return res.json({
        qrUrl: qrApi,
        menuUrl,
        businessName: profile.businessName,
      })
    }

    res.redirect(qrApi)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

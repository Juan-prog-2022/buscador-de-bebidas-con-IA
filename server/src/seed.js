import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import pc from 'picocolors'
import { connectDB, sequelize } from './config/database.js'
import { User } from './models/User.js'
import { Category } from './models/Category.js'
import { Recipe } from './models/Recipe.js'
import { Rating } from './models/Rating.js'
import { Ingredient, RecipeIngredient } from './models/index.js'
import './models/index.js'

dotenv.config()

async function seed() {
  console.log(pc.cyan('━'.repeat(40)))
  console.log(pc.bold(pc.yellow(' 🌱 Seeding database...')))
  console.log(pc.cyan('━'.repeat(40)))

  await connectDB()
  await sequelize.sync({ force: true })

  const password = await bcrypt.hash('admin123', 12)
  const owner = await User.create({
    name: 'Admin Owner',
    email: 'owner@bar.com',
    password,
    role: 'owner',
  })
  console.log(pc.green('✓'), pc.bold('Owner created:'), pc.cyan('owner@bar.com'))

  const categories = await Category.bulkCreate([
    { name: 'Cócteles Clásicos', type: 'drink', description: 'Cócteles tradicionales y emblemáticos' },
    { name: 'Cócteles Sin Alcohol', type: 'drink', description: 'Bebidas mocktail y sin alcohol' },
    { name: 'Cervezas Artesanales', type: 'drink', description: 'Cervezas de elaboración propia e importadas' },
    { name: 'Vinos y Licores', type: 'drink', description: 'Selección de vinos y licores' },
    { name: 'Bebidas Calientes', type: 'drink', description: 'Cafés, tés, chocolate caliente e infusiones' },
    { name: 'Batidos y Smoothies', type: 'drink', description: 'Bebidas cremosas de frutas y lácteos' },
    { name: 'Postres Fríos', type: 'dessert', description: 'Helados, mousses, cheesecakes y postres fríos' },
    { name: 'Postres Horneados', type: 'dessert', description: 'Tartas, pasteles y postres horneados' },
    { name: 'Postres Argentinos', type: 'dessert', description: 'Dulce de leche, alfajores, vigilantes y criollos' },
    { name: 'Entradas y Snacks', type: 'general', description: 'Aperitivos, tapas y entradas' },
    { name: 'Ensaladas', type: 'general', description: 'Ensaladas frescas y completas' },
    { name: 'Platos Principales', type: 'general', description: 'Platos fuertes y principales' },
    { name: 'Salsas y Acompañamientos', type: 'general', description: 'Guarniciones, salsas y dips' },
  ])
  console.log(pc.green('✓'), pc.bold(`${categories.length} categories created`))

  const ingredients = await Ingredient.bulkCreate([
    { name: 'Tequila blanco', unit: 'ml', unitPrice: 0.08, category: 'Licores', userId: owner.id },
    { name: 'Jugo de limón fresco', unit: 'ml', unitPrice: 0.03, category: 'Jugos', userId: owner.id },
    { name: 'Triple sec', unit: 'ml', unitPrice: 0.12, category: 'Licores', userId: owner.id },
    { name: 'Ron blanco', unit: 'ml', unitPrice: 0.07, category: 'Licores', userId: owner.id },
    { name: 'Menta fresca', unit: 'hojas', unitPrice: 0.05, category: 'Hierbas', userId: owner.id },
    { name: 'Azúcar', unit: 'g', unitPrice: 0.002, category: 'Básicos', userId: owner.id },
    { name: 'Agua con gas', unit: 'ml', unitPrice: 0.005, category: 'Bebidas', userId: owner.id },
    { name: 'Mascarpone', unit: 'g', unitPrice: 0.03, category: 'Lácteos', userId: owner.id },
    { name: 'Huevos', unit: 'uds', unitPrice: 0.15, category: 'Básicos', userId: owner.id },
    { name: 'Café fuerte', unit: 'ml', unitPrice: 0.02, category: 'Bebidas', userId: owner.id },
    { name: 'Bizcochos de soletilla', unit: 'g', unitPrice: 0.025, category: 'Básicos', userId: owner.id },
    { name: 'Cacao en polvo', unit: 'g', unitPrice: 0.04, category: 'Básicos', userId: owner.id },
  ])
  console.log(pc.green('✓'), pc.bold(`${ingredients.length} ingredients created`))

  const recipes = await Recipe.bulkCreate([
    {
      name: 'Margarita Clásica',
      description: 'El cóctel mexicano por excelencia, equilibrado y refrescante',
      ingredients: ['50ml Tequila blanco', '30ml Jugo de limón fresco', '20ml Triple sec', 'Hielo', 'Sal para el borde', 'Rodaja de limón'],
      instructions: 'Escarchar el borde del vaso con sal. En coctelera, mezclar tequila, jugo de limón y triple sec con hielo. Agitar 15 segundos. Servir en el vaso escarchado. Decorar con rodaja de limón.',
      categoryId: categories[0].id,
      userId: owner.id,
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop',
      costPrice: 8.10,
      suggestedPrice: 20.25,
      profitMargin: 60,
      laborCost: 2.00,
    },
    {
      name: 'Mojito Cubano',
      description: 'El clásico cubano de menta y lima',
      ingredients: ['50ml Ron blanco', '12 hojas de menta', '30ml Jugo de lima', '2 cdas Azúcar', 'Agua con gas', 'Hielo picado'],
      instructions: 'En vaso alto, machacar suavemente menta con azúcar y jugo de lima. Agregar ron, llenar con hielo picado. Completar con agua con gas. Remover suavemente. Decorar con ramita de menta.',
      categoryId: categories[0].id,
      userId: owner.id,
      imageUrl: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&h=300&fit=crop',
      costPrice: 6.35,
      suggestedPrice: 17.50,
      profitMargin: 63.7,
      laborCost: 2.50,
    },
    {
      name: 'Tiramisú Clásico',
      description: 'Postre italiano tradicional con café y mascarpone',
      ingredients: ['500g Mascarpone', '4 Huevos', '100g Azúcar', '300ml Café fuerte', '200g Bizcochos de soletilla', 'Cacao en polvo'],
      instructions: 'Separar claras y yemas. Batir yemas con azúcar, agregar mascarpone. Montar claras a punto de nieve e incorporar. Remojar bizcochos en café. Capas alternas de bizcochos y crema. Refrigerar 6 horas. Espolvorear cacao.',
      categoryId: categories[6].id,
      userId: owner.id,
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
      costPrice: 28.50,
      suggestedPrice: 72.00,
      profitMargin: 60.4,
      laborCost: 5.00,
    },
  ])
  console.log(pc.green('✓'), pc.bold(`${recipes.length} recipes created`))

  await RecipeIngredient.bulkCreate([
    { recipeId: recipes[0].id, ingredientId: ingredients[0].id, quantity: 50 },
    { recipeId: recipes[0].id, ingredientId: ingredients[1].id, quantity: 30 },
    { recipeId: recipes[0].id, ingredientId: ingredients[2].id, quantity: 20 },
    { recipeId: recipes[1].id, ingredientId: ingredients[3].id, quantity: 50 },
    { recipeId: recipes[1].id, ingredientId: ingredients[4].id, quantity: 12 },
    { recipeId: recipes[1].id, ingredientId: ingredients[1].id, quantity: 30 },
    { recipeId: recipes[1].id, ingredientId: ingredients[5].id, quantity: 20 },
    { recipeId: recipes[1].id, ingredientId: ingredients[6].id, quantity: 100 },
    { recipeId: recipes[2].id, ingredientId: ingredients[7].id, quantity: 500 },
    { recipeId: recipes[2].id, ingredientId: ingredients[8].id, quantity: 4 },
    { recipeId: recipes[2].id, ingredientId: ingredients[5].id, quantity: 100 },
    { recipeId: recipes[2].id, ingredientId: ingredients[9].id, quantity: 300 },
    { recipeId: recipes[2].id, ingredientId: ingredients[10].id, quantity: 200 },
    { recipeId: recipes[2].id, ingredientId: ingredients[11].id, quantity: 20 },
  ])
  console.log(pc.green('✓'), pc.bold(`Recipe-Ingredient links created`))

  console.log(pc.cyan('━'.repeat(40)))
  console.log(pc.green('✓'), pc.bold(pc.green('Database seeded successfully!')))
  console.log(pc.yellow('🔑'), pc.bold('Owner login:'), pc.cyan('owner@bar.com'), '/', pc.yellow('admin123'))
  console.log(pc.cyan('━'.repeat(40)))
  process.exit(0)
}

seed().catch((err) => {
  console.error(pc.red('✗ Seed error:'), err)
  process.exit(1)
})

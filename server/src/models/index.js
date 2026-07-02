import { User } from './User.js'
import { Category } from './Category.js'
import { Recipe } from './Recipe.js'
import { Rating } from './Rating.js'
import { Favorite } from './Favorite.js'
import { Ingredient } from './Ingredient.js'
import { RecipeIngredient } from './RecipeIngredient.js'
import { Collection } from './Collection.js'
import { RecipeCollection } from './RecipeCollection.js'
import { InventoryItem } from './InventoryItem.js'
import { BusinessProfile } from './BusinessProfile.js'

User.hasMany(Recipe, { foreignKey: 'userId' })
Recipe.belongsTo(User, { foreignKey: 'userId' })

Category.hasMany(Recipe, { foreignKey: 'categoryId' })
Recipe.belongsTo(Category, { foreignKey: 'categoryId' })

Recipe.hasMany(Rating, { foreignKey: 'recipeId' })
Rating.belongsTo(Recipe, { foreignKey: 'recipeId' })

User.hasMany(Rating, { foreignKey: 'userId' })
Rating.belongsTo(User, { foreignKey: 'userId' })

User.belongsToMany(Recipe, { through: Favorite, as: 'favorites', foreignKey: 'userId' })
Recipe.belongsToMany(User, { through: Favorite, as: 'favoritedBy', foreignKey: 'recipeId' })

Recipe.hasMany(Favorite, { foreignKey: 'recipeId' })
Favorite.belongsTo(Recipe, { foreignKey: 'recipeId' })

User.hasMany(Favorite, { foreignKey: 'userId' })
Favorite.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Ingredient, { foreignKey: 'userId' })
Ingredient.belongsTo(User, { foreignKey: 'userId' })

Recipe.belongsToMany(Ingredient, { through: RecipeIngredient, as: 'costIngredients', foreignKey: 'recipeId' })
Ingredient.belongsToMany(Recipe, { through: RecipeIngredient, as: 'recipes', foreignKey: 'ingredientId' })

Recipe.hasMany(RecipeIngredient, { foreignKey: 'recipeId' })
RecipeIngredient.belongsTo(Recipe, { foreignKey: 'recipeId' })

Ingredient.hasMany(RecipeIngredient, { foreignKey: 'ingredientId' })
RecipeIngredient.belongsTo(Ingredient, { foreignKey: 'ingredientId' })

User.hasMany(Collection, { foreignKey: 'userId' })
Collection.belongsTo(User, { foreignKey: 'userId' })

Collection.belongsToMany(Recipe, { through: RecipeCollection, as: 'recipes', foreignKey: 'collectionId' })
Recipe.belongsToMany(Collection, { through: RecipeCollection, as: 'collections', foreignKey: 'recipeId' })

Collection.hasMany(RecipeCollection, { foreignKey: 'collectionId' })
RecipeCollection.belongsTo(Collection, { foreignKey: 'collectionId' })

Recipe.hasMany(RecipeCollection, { foreignKey: 'recipeId' })
RecipeCollection.belongsTo(Recipe, { foreignKey: 'recipeId' })

User.hasMany(InventoryItem, { foreignKey: 'userId' })
InventoryItem.belongsTo(User, { foreignKey: 'userId' })

Ingredient.hasOne(InventoryItem, { foreignKey: 'ingredientId' })
InventoryItem.belongsTo(Ingredient, { foreignKey: 'ingredientId' })

User.hasOne(BusinessProfile, { foreignKey: 'userId' })
BusinessProfile.belongsTo(User, { foreignKey: 'userId' })

export { User, Category, Recipe, Rating, Favorite, Ingredient, RecipeIngredient, Collection, RecipeCollection, InventoryItem, BusinessProfile }

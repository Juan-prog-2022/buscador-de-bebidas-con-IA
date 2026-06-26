import { User } from './User.js'
import { Category } from './Category.js'
import { Recipe } from './Recipe.js'
import { Rating } from './Rating.js'
import { Favorite } from './Favorite.js'

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

export { User, Category, Recipe, Rating, Favorite }

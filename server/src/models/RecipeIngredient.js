import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const RecipeIngredient = sequelize.define('RecipeIngredient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  recipeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'recipe_id',
  },
  ingredientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ingredient_id',
  },
  quantity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
})

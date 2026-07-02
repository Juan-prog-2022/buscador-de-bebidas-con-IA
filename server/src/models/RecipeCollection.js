import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const RecipeCollection = sequelize.define('RecipeCollection', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  collectionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'collection_id',
  },
  recipeId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'recipe_id',
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
})

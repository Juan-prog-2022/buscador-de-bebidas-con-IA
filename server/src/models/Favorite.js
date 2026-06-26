import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
}, {
  indexes: [
    { unique: true, fields: ['user_id', 'recipe_id'] },
  ],
})

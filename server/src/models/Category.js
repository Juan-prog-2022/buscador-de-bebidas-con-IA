import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('drink', 'dessert', 'general'),
    allowNull: false,
    defaultValue: 'general',
  },
  description: {
    type: DataTypes.TEXT,
  },
})

import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Recipe = sequelize.define('Recipe', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  ingredients: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
    field: 'image_url',
  },
  averageRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'average_rating',
  },
  costPrice: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'cost_price',
  },
  suggestedPrice: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'suggested_price',
  },
  profitMargin: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'profit_margin',
  },
  laborCost: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'labor_cost',
  },
})

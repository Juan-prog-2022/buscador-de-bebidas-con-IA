import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const BusinessProfile = sequelize.define('BusinessProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  businessName: {
    type: DataTypes.STRING,
    field: 'business_name',
  },
  logo: {
    type: DataTypes.STRING,
  },
  primaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#4338ca',
    field: 'primary_color',
  },
  accentColor: {
    type: DataTypes.STRING,
    defaultValue: '#6d28d9',
    field: 'accent_color',
  },
  welcomeMessage: {
    type: DataTypes.TEXT,
    field: 'welcome_message',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
})

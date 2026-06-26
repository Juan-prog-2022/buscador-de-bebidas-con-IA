import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
import pc from 'picocolors'

dotenv.config()

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
})

export async function connectDB() {
  try {
    await sequelize.authenticate()
    console.log(pc.green('✓'), pc.bold('PostgreSQL connected'))
  } catch (error) {
    console.error(pc.red('✗ DB connection error:'), error)
    process.exit(1)
  }
}

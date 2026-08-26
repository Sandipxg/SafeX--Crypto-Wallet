import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://safex:safexpassword@localhost:5435/safex_db',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'safex_jwt_access_secret_development_key_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'safex_jwt_refresh_secret_development_key_2026'
}

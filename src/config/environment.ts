import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appName: 'API Super Brasa Fut',
  appVersion: '1.0.0',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  defaultLimit: 20,
  maxLimit: 100,
};

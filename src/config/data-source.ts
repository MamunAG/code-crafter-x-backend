import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { getDatabasePoolConfig } from './database-pool.config';

dotenv.config(); // Loads .env

const poolConfig = getDatabasePoolConfig((key) => process.env[key]);

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    process.env.NODE_ENV === 'development'
      ? 'src/**/*.entity.ts'
      : 'dist/**/*.entity.js',
    process.env.NODE_ENV === 'development'
      ? 'src/**/*.entities.ts'
      : 'dist/**/*.entities.js',
  ],
  migrations: [
    process.env.NODE_ENV === 'development'
      ? 'src/migrations/*.ts'
      : 'dist/migrations/*.js',
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  extra: {
    max: poolConfig.max,
    idleTimeoutMillis: poolConfig.idleTimeoutMillis,
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
  },
  ssl:
    process.env.DB_SSL_ENABLED === 'true'
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

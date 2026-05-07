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
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
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

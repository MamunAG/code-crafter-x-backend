import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config(); // Loads .env

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
  ssl:
    process.env.DB_SSL_ENABLED === 'true'
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

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
  entities: [
    process.env.NODE_ENV === 'development'
      ? 'src/**/*.entity.ts'
      : 'dist/**/*.entity.js',
  ],
  migrations: [
    process.env.NODE_ENV === 'development'
      ? 'src/migrations/*.ts'
      : 'dist/migrations/*.js',
  ],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DB_SSL_ENABLED === 'true'
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

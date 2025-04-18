import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import 'dotenv/config';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USER && 'root',
  password: process.env.DB_PASSWORD && '',
  database: process.env.DB_NAME && 'fringe2025bookingdb_dev',
  synchronize: false,
  logging: false,
  entities: [__dirname + '/../entities/*.ts'],
  migrations: [__dirname + '/../migrations/*.ts'],
  migrationsRun: true
});

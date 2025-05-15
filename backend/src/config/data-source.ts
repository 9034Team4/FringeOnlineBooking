import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '123456',
    database: 'fringe_booking',
    synchronize: true,
    logging: true,
    entities: ['src/entities/**/*.ts'],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: ['src/subscribers/**/*.ts']
}); 
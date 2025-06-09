import { DataSource } from 'typeorm';
import 'dotenv/config';
import path from 'path';
import { User } from '../entities/User';
import { Event } from '../entities/Event';
import { Booking } from '../entities/Booking';
import { Ticket } from '../entities/Ticket';
import { Payment } from '../entities/Payment';
import { EventCategory } from '../entities/EventCategory';
import { Venue } from '../entities/Venue';
import { Seat } from '../entities/Seat';
import { Message } from '../entities/Message';

// 判断当前环境
const isProduction = process.env.NODE_ENV === 'production';

// 获取实体文件的路径（根据环境不同选择不同路径）
const entitiesDir = isProduction 
  ? path.join(__dirname, '..', 'entities')
  : path.join(__dirname, '..', 'entities'); 

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'fringe2025bookingdb_dev',
    synchronize: true,
    logging: isProduction ? false : true,
    entities: [
        User,
        Event,
        Booking,
        Ticket,
        Payment,
        EventCategory,
        Venue,
        Seat,
        Message,
    ],    
    migrations: isProduction
      ? [path.join(__dirname, '..', 'migrations', '**', '*.js')]
      : [path.join(__dirname, '..', 'migrations', '**', '*.ts')],
    subscribers: isProduction
      ? [path.join(__dirname, '..', 'subscribers', '**', '*.js')]
      : [path.join(__dirname, '..', 'subscribers', '**', '*.ts')]
}); 
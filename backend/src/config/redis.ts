import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

console.log('CACHE_PORT:', process.env.CACHE_PORT);

if (!process.env.CACHE_PORT) {
  throw new Error('CACHE_PORT is not a valid number.');
}

const port = Number(process.env.CACHE_PORT);
if (isNaN(port)) {
  throw new Error('CACHE_PORT is not a valid number.');
}

export const redisClient = createClient({
  socket: {
    host: process.env.CACHE_HOST,
    port: Number(process.env.CACHE_PORT),
  },
  username: process.env.CACHE_USERNAME || undefined,
  password: process.env.CACHE_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

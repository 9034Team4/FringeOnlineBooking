import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

let rawPort = process.env.CACHE_PORT;

if (!rawPort || isNaN(Number(rawPort))) {
  rawPort = '6379';
}

const port = Number(rawPort);

export const redisClient = createClient({
  socket: {
    host: process.env.CACHE_HOST || 'localhost',
    port,
  }
});


redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

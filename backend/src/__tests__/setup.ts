import 'reflect-metadata';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';

describe('Test Setup', () => {
    it('should load environment variables', () => {
        expect(process.env.JWT_SECRET).toBe('test-secret');
        expect(process.env.DATABASE_URL).toBe('mysql://test:test@localhost:3306/test_db');
    });
}); 
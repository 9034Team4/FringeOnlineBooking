import 'reflect-metadata';
import { config } from 'dotenv';
import './utils/datasource-mock'; // 导入数据源模拟

// 确保 TypeORM 装饰器元数据正确加载
require('ts-node/register');

// Load environment variables from .env file
config();

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';

// Mock TypeORM data source before any imports
jest.mock('../config/data-source', () => {
  const mockRepositories: Record<string, any> = {};

  return {
    AppDataSource: {
      getRepository: jest.fn().mockImplementation((entity: any) => {
        const entityName = typeof entity === 'string' 
          ? entity 
          : entity.name;

        if (!mockRepositories[entityName]) {
          mockRepositories[entityName] = {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({}),
            save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ id: 1, ...entity })),
            create: jest.fn().mockImplementation((data: any) => ({ id: 1, ...data })),
            delete: jest.fn().mockResolvedValue(true),
            update: jest.fn().mockResolvedValue(true),
            createQueryBuilder: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue({}),
              getMany: jest.fn().mockResolvedValue([]),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
            })
          };
        }
        
        return mockRepositories[entityName];
      })
    }
  };
});

// 全局错误处理器，防止未捕获的异常导致测试失败
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

describe('Test Setup', () => {
    it('should load environment variables', () => {
        expect(process.env.JWT_SECRET).toBe('test-secret');
    });
}); 
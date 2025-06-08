import { ObjectLiteral } from 'typeorm';
import { getMockRepository } from './repository-mock';
import { User } from '../../entities/User';
import { Booking } from '../../entities/Booking';
import { Event } from '../../entities/Event';
import { Ticket } from '../../entities/Ticket';

// 存储所有模拟仓库实例
const repositories: Record<string, any> = {};

// 为所有实体创建模拟存储库
repositories['User'] = getMockRepository<User>();
repositories['Booking'] = getMockRepository<Booking>();
repositories['Event'] = getMockRepository<Event>();
repositories['Ticket'] = getMockRepository<Ticket>();

// 导出获取仓库实例的函数
export const getMockRepositoryInstance = <T extends ObjectLiteral>(entityName: string) => {
  if (!repositories[entityName]) {
    repositories[entityName] = getMockRepository<T>();
  }
  return repositories[entityName];
};

// 创建 AppDataSource 模拟
const mockAppDataSource = {
  getRepository: jest.fn().mockImplementation((entity: any) => {
    const entityName = typeof entity === 'string' 
      ? entity 
      : entity.name;
      
    // 如果没有该实体的存储库，则创建一个
    if (!repositories[entityName]) {
      repositories[entityName] = getMockRepository<ObjectLiteral>();
    }
    
    return repositories[entityName];
  })
};

// 模拟 AppDataSource
jest.mock('../../config/data-source', () => ({
  AppDataSource: mockAppDataSource
})); 
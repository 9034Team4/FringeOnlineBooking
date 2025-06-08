import { Repository, ObjectLiteral } from 'typeorm';

export class MockRepository<Entity extends ObjectLiteral> implements Partial<Repository<Entity>> {
  private mockData: Entity[] = [];

  find = jest.fn().mockImplementation(() => Promise.resolve(this.mockData));
  findOne = jest.fn().mockImplementation(() => Promise.resolve(this.mockData[0] || null));
  save = jest.fn().mockImplementation((entity: Partial<Entity>) => {
    const savedEntity = { id: Date.now(), ...entity } as unknown as Entity;
    this.mockData.push(savedEntity);
    return Promise.resolve(savedEntity);
  });
  create = jest.fn().mockImplementation((entity: Partial<Entity>) => {
    return { id: Date.now(), ...entity } as unknown as Entity;
  });
  update = jest.fn().mockImplementation(() => Promise.resolve(true));
  delete = jest.fn().mockImplementation(() => Promise.resolve(true));
  createQueryBuilder = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockImplementation(() => Promise.resolve(this.mockData[0] || null)),
    getMany: jest.fn().mockImplementation(() => Promise.resolve(this.mockData)),
  });

  setMockData(data: Entity[]) {
    this.mockData = data;
  }

  clearMockData() {
    this.mockData = [];
  }

  addMockData(entity: Entity) {
    this.mockData.push(entity);
  }
}

export const getMockRepository = <Entity extends ObjectLiteral>(): Repository<Entity> & { 
  setMockData: (data: Entity[]) => void;
  clearMockData: () => void;
  addMockData: (entity: Entity) => void;
} => {
  return new MockRepository<Entity>() as any;
}; 
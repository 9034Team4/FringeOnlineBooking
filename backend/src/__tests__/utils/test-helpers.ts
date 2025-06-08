import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';
import { Event } from '../../entities/Event';
import { Booking } from '../../entities/Booking';

/**
 * 为测试创建模拟用户数据
 */
export const createMockUser = (overrides: Partial<User> = {}): User => {
  return {
    id: `user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: 'hashed-password',
    role: UserRole.USER,
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as User;
};

/**
 * 为测试创建模拟事件数据
 */
export const createMockEvent = (overrides: Partial<Event> = {}): Event => {
  return {
    id: `event-${Date.now()}`,
    name: `Test Event ${Date.now()}`,
    description: 'Test event description',
    startTime: new Date(Date.now() + 86400000), // 明天
    endTime: new Date(Date.now() + 172800000), // 后天
    totalCapacity: 100,
    availableCapacity: 100,
    basePrice: 10.99,
    isActive: true,
    isSoldOut: false,
    status: 'UPCOMING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as Event;
};

/**
 * 为测试创建模拟预订数据
 */
export const createMockBooking = (overrides: Partial<Booking> = {}): Booking => {
  return {
    id: `booking-${Date.now()}`,
    status: 'PENDING',
    totalAmount: 10.99,
    paymentStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as Booking;
};

/**
 * 设置模拟存储库数据
 */
export const setupMockRepository = <T>(entityName: string, mockData: T[]) => {
  const repository = AppDataSource.getRepository(entityName);
  
  // 直接访问存储库内部并设置模拟数据
  // 注意：这只适用于我们的 MockRepository 实现
  if (repository && 'setMockData' in repository) {
    (repository as any).setMockData(mockData);
  }
  
  return repository;
}; 
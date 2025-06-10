// src/controllers/admin/EventController.ts

import { Request, Response } from 'express';
import { eventCreateSchema, eventUpdateSchema } from '../../schemas/admin';
import { ZodError } from 'zod';
import { AppDataSource } from '../../config/data-source';
import { Event, EventStatus } from '../../entities/Event';
import { Venue } from '../../entities/Venue';
import { EventCategory } from '../../entities/EventCategory';

export const EventController = {
  /**
   * Get a list of all events.
   */
  async getAll(req: Request, res: Response) {
    try {
      const eventRepository = AppDataSource.getRepository(Event);
      
      // 获取查询参数
      const { page = 1, limit = 10, status, category, search } = req.query;
      
      // 构建查询条件
      const queryBuilder = eventRepository.createQueryBuilder('event')
        .leftJoinAndSelect('event.venue', 'venue')
        .leftJoinAndSelect('event.category', 'category')
        .leftJoinAndSelect('event.organizer', 'organizer');
      
      // 添加过滤条件
      if (status) {
        queryBuilder.andWhere('event.status = :status', { status });
      }
      
      if (category) {
        queryBuilder.andWhere('category.name = :category', { category });
      }
      
      if (search) {
        queryBuilder.andWhere(
          '(event.name LIKE :search OR event.description LIKE :search)',
          { search: `%${search}%` }
        );
      }
      
      // 分页
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;
      
      queryBuilder.skip(skip).take(limitNum);
      
      // 获取结果
      const [events, total] = await queryBuilder.getManyAndCount();
      
      // 格式化结果以匹配前端期望的格式
      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.name,
        description: event.description,
        startDate: event.startTime,
        endDate: event.endTime,
        venueId: event.venue?.id,
        venueName: event.venue?.name,
        price: event.basePrice,
        capacity: event.totalCapacity,
        category: event.category?.name,
        status: event.status.toLowerCase(),
        imageUrl: event.imageUrl,
        isActive: event.isActive,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }));

      return res.status(200).json({
        success: true,
        message: 'Events retrieved successfully',
        data: formattedEvents,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch events',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Create a new event.
   */
  async create(req: Request, res: Response) {
    try {
      const validatedData = eventCreateSchema.parse(req.body);
      
      const eventRepository = AppDataSource.getRepository(Event);
      const venueRepository = AppDataSource.getRepository(Venue);
      const categoryRepository = AppDataSource.getRepository(EventCategory);
      
      // 查找场地
      const venue = await venueRepository.findOne({ 
        where: { id: parseInt(validatedData.venueId, 10) } 
      });
      
      if (!venue) {
        return res.status(404).json({
          success: false,
          message: 'Venue not found',
          error: `No venue found with ID ${validatedData.venueId}`
        });
      }
      
      // 查找分类
      let category;
      if (validatedData.category) {
        category = await categoryRepository.findOne({ 
          where: { name: validatedData.category } 
        });
        
        // 如果分类不存在，创建新分类
        if (!category) {
          category = categoryRepository.create({ name: validatedData.category });
          await categoryRepository.save(category);
        }
      }
      
      // 创建新事件
      const newEvent = eventRepository.create({
        name: validatedData.title,
        description: validatedData.description,
        startTime: new Date(validatedData.startDate),
        endTime: new Date(validatedData.endDate),
        venue: venue,
        category: category,
        basePrice: validatedData.price,
        totalCapacity: validatedData.capacity,
        availableCapacity: validatedData.capacity,
        status: validatedData.status.toUpperCase() as unknown as EventStatus,
        organizer: req.user, // 使用当前登录用户作为组织者
        imageUrl: validatedData.imageUrl || null // 添加图片URL字段
      });
      
      await eventRepository.save(newEvent);
      
      // 格式化返回数据
      const formattedEvent = {
        id: newEvent.id,
        title: newEvent.name,
        description: newEvent.description,
        startDate: newEvent.startTime,
        endDate: newEvent.endTime,
        venueId: venue.id,
        venueName: venue.name,
        price: newEvent.basePrice,
        capacity: newEvent.totalCapacity,
        category: category?.name,
        status: newEvent.status.toLowerCase(),
        imageUrl: newEvent.imageUrl, // 返回图片URL
        createdAt: newEvent.createdAt
      };

      return res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: formattedEvent
      });
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create event',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get event details by ID.
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const eventRepository = AppDataSource.getRepository(Event);
      
      const event = await eventRepository.findOne({
        where: { id },
        relations: ['venue', 'category', 'organizer']
      });
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
          error: `No event found with ID ${id}`
        });
      }
      
      // 格式化返回数据
      const formattedEvent = {
        id: event.id,
        title: event.name,
        description: event.description,
        startDate: event.startTime,
        endDate: event.endTime,
        venueId: event.venue?.id,
        venueName: event.venue?.name,
        price: event.basePrice,
        capacity: event.totalCapacity,
        category: event.category?.name,
        status: event.status.toLowerCase(),
        imageUrl: event.imageUrl,
        isActive: event.isActive,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      };

      return res.status(200).json({
        success: true,
        message: 'Event retrieved successfully',
        data: formattedEvent
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve event',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Update an existing event.
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = eventUpdateSchema.parse(req.body);
      
      const eventRepository = AppDataSource.getRepository(Event);
      const venueRepository = AppDataSource.getRepository(Venue);
      const categoryRepository = AppDataSource.getRepository(EventCategory);
      
      // 查找事件
      const event = await eventRepository.findOne({
        where: { id },
        relations: ['venue', 'category']
      });
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
          error: `No event found with ID ${id}`
        });
      }
      
      // 更新场地（如果提供）
      if (validatedData.venueId) {
        const venue = await venueRepository.findOne({ 
          where: { id: parseInt(validatedData.venueId, 10) } 
        });
        
        if (!venue) {
          return res.status(404).json({
            success: false,
            message: 'Venue not found',
            error: `No venue found with ID ${validatedData.venueId}`
          });
        }
        
        event.venue = venue;
      }
      
      // 更新分类（如果提供）
      if (validatedData.category) {
        let category = await categoryRepository.findOne({ 
          where: { name: validatedData.category } 
        });
        
        // 如果分类不存在，创建新分类
        if (!category) {
          category = categoryRepository.create({ name: validatedData.category });
          await categoryRepository.save(category);
        }
        
        event.category = category;
      }
      
      // 更新其他字段
      if (validatedData.title) event.name = validatedData.title;
      if (validatedData.description) event.description = validatedData.description;
      if (validatedData.startDate) event.startTime = new Date(validatedData.startDate);
      if (validatedData.endDate) event.endTime = new Date(validatedData.endDate);
      if (validatedData.price) event.basePrice = validatedData.price;
      if (validatedData.capacity) {
        event.totalCapacity = validatedData.capacity;
        // 更新可用容量（保持已售出的票数不变）
        const soldTickets = event.totalCapacity - event.availableCapacity;
        event.availableCapacity = validatedData.capacity - soldTickets;
      }
      if (validatedData.status) {
        event.status = validatedData.status.toUpperCase() as unknown as EventStatus;
      }
      // 更新图片URL（如果提供）
      if (validatedData.imageUrl !== undefined) {
        event.imageUrl = validatedData.imageUrl;
      }
      
      await eventRepository.save(event);
      
      // 格式化返回数据
      const formattedEvent = {
        id: event.id,
        title: event.name,
        description: event.description,
        startDate: event.startTime,
        endDate: event.endTime,
        venueId: event.venue?.id,
        venueName: event.venue?.name,
        price: event.basePrice,
        capacity: event.totalCapacity,
        category: event.category?.name,
        status: event.status.toLowerCase(),
        imageUrl: event.imageUrl,
        isActive: event.isActive,
        updatedAt: event.updatedAt
      };

      return res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: formattedEvent
      });
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to update event',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Delete an event.
   */
  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const eventRepository = AppDataSource.getRepository(Event);
      
      const event = await eventRepository.findOne({ where: { id } });
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
          error: `No event found with ID ${id}`
        });
      }
      
      // 软删除 - 将事件标记为非活动状态而不是真正删除
      event.isActive = false;
      event.status = EventStatus.CANCELLED;
      await eventRepository.save(event);
      
      // 如果需要真正删除，可以使用以下代码
      // await eventRepository.remove(event);
      
      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
        data: { id }
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete event',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },
};

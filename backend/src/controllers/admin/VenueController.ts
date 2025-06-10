import { Request, Response } from 'express';
import { venueCreateSchema, venueUpdateSchema } from '../../schemas/admin';
import { ZodError } from 'zod';
import { AppDataSource } from '../../config/data-source';
import { Venue } from '../../entities/Venue';
import { Event } from '../../entities/Event';

export const VenueController = {
  /**
   * Get all venues
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const venueRepository = AppDataSource.getRepository(Venue);
      
      // 获取查询参数
      const { page = 1, limit = 10, search } = req.query;
      
      // 构建查询条件
      const queryBuilder = venueRepository.createQueryBuilder('venue');
      
      // 添加搜索条件
      if (search) {
        queryBuilder.where(
          'venue.name LIKE :search OR venue.address LIKE :search OR venue.city LIKE :search',
          { search: `%${search}%` }
        );
      }
      
      // 分页
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;
      
      queryBuilder.skip(skip).take(limitNum);
      
      // 获取结果
      const [venues, total] = await queryBuilder.getManyAndCount();
      
      // 格式化结果以匹配前端期望的格式
      const formattedVenues = venues.map(venue => ({
        id: venue.id.toString(),
        name: venue.name,
        address: venue.address,
        capacity: venue.capacity,
        description: venue.address, // 使用 address 作为描述，因为 Venue 实体中没有 description 字段
        facilities: [] // 添加空的设施列表，因为 Venue 实体中没有 facilities 字段
      }));

      res.status(200).json({
        success: true,
        message: 'Venues retrieved successfully',
        data: formattedVenues,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err: unknown) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch venues',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Create a new venue
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = venueCreateSchema.parse(req.body);
      const venueRepository = AppDataSource.getRepository(Venue);
      
      // 创建新场馆
      const newVenue = venueRepository.create({
        name: validatedData.name,
        address: validatedData.address,
        capacity: validatedData.capacity,
        // 注意：我们不能直接设置 description 和 facilities，因为 Venue 实体中没有这些字段
        // 但我们可以将 description 存储在 location 字段中
        location: validatedData.description
      });
      
      await venueRepository.save(newVenue);
      
      // 格式化返回数据
      const formattedVenue = {
        id: newVenue.id.toString(),
        name: newVenue.name,
        address: newVenue.address,
        capacity: newVenue.capacity,
        description: validatedData.description,
        facilities: validatedData.facilities
      };

      res.status(201).json({
        success: true,
        message: 'Venue created successfully',
        data: formattedVenue
      });
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create venue',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get venue details by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const venueRepository = AppDataSource.getRepository(Venue);
      
      const venue = await venueRepository.findOne({
        where: { id: parseInt(id, 10) }
      });
      
      if (!venue) {
        res.status(404).json({
          success: false,
          message: 'Venue not found',
          error: `No venue found with ID ${id}`
        });
        return;
      }
      
      // 格式化返回数据
      const formattedVenue = {
        id: venue.id.toString(),
        name: venue.name,
        address: venue.address,
        capacity: venue.capacity,
        description: venue.location || '', // 使用 location 字段作为描述
        facilities: [] // 添加空的设施列表
      };

      res.status(200).json({
        success: true,
        message: 'Venue retrieved successfully',
        data: formattedVenue
      });
    } catch (err: unknown) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve venue',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Update an existing venue
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = venueUpdateSchema.parse(req.body);
      const venueRepository = AppDataSource.getRepository(Venue);
      
      // 查找场馆
      const venue = await venueRepository.findOne({
        where: { id: parseInt(id, 10) }
      });
      
      if (!venue) {
        res.status(404).json({
          success: false,
          message: 'Venue not found',
          error: `No venue found with ID ${id}`
        });
        return;
      }
      
      // 更新场馆信息
      if (validatedData.name) venue.name = validatedData.name;
      if (validatedData.address) venue.address = validatedData.address;
      if (validatedData.capacity !== undefined) venue.capacity = validatedData.capacity;
      if (validatedData.description) venue.location = validatedData.description; // 使用 location 字段存储描述
      
      await venueRepository.save(venue);
      
      // 格式化返回数据
      const formattedVenue = {
        id: venue.id.toString(),
        name: venue.name,
        address: venue.address,
        capacity: venue.capacity,
        description: venue.location || '',
        facilities: validatedData.facilities || []
      };

      res.status(200).json({
        success: true,
        message: 'Venue updated successfully',
        data: formattedVenue
      });
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid input data',
          error: err.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update venue',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Delete a venue
   */
  async remove(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const venueRepository = AppDataSource.getRepository(Venue);
      const eventRepository = AppDataSource.getRepository(Event);
      
      // 查找场馆
      const venue = await venueRepository.findOne({
        where: { id: parseInt(id, 10) }
      });
      
      if (!venue) {
        res.status(404).json({
          success: false,
          message: 'Venue not found',
          error: `No venue found with ID ${id}`
        });
        return;
      }
      
      // 检查是否有关联的事件
      const relatedEvents = await eventRepository.count({
        where: { venue: { id: venue.id } }
      });
      
      if (relatedEvents > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete venue with associated events',
          error: `This venue has ${relatedEvents} associated events. Please delete or reassign these events first.`
        });
        return;
      }
      
      // 删除场馆
      await venueRepository.remove(venue);

      res.status(200).json({
        success: true,
        message: 'Venue deleted successfully',
        data: { id: id.toString() }
      });
    } catch (err: unknown) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Failed to delete venue',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get events by venue ID
   */
  async getEventsByVenueId(req: Request, res: Response): Promise<void> {
    try {
      const { venueId } = req.params;
      const eventRepository = AppDataSource.getRepository(Event);
      
      // 查找指定场馆的所有事件
      const events = await eventRepository.find({
        where: { venue: { id: parseInt(venueId, 10) } },
        relations: ['venue', 'category']
      });
      
      // 格式化结果以匹配前端期望的格式
      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.name,
        description: event.description,
        startDate: event.startTime,
        endDate: event.endTime,
        venueId: event.venue?.id.toString(),
        venueName: event.venue?.name,
        price: event.basePrice,
        capacity: event.totalCapacity,
        category: event.category?.name,
        status: event.status.toLowerCase(),
        imageUrl: event.imageUrl,
        isActive: event.isActive
      }));

      res.status(200).json({
        success: true,
        message: 'Events for venue retrieved successfully',
        data: formattedEvents
      });
    } catch (err: unknown) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch events for venue',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  }
};
import { Request, Response } from 'express';
import { settingUpdateSchema } from '../../schemas/admin';
import { ZodError } from 'zod';

export const AdminSettingsController = {
  /**
   * Get all admin settings
   */
  async getAll(req: Request, res: Response) {
    try {
      // TODO: Ensure admin is authenticated
      
      // TODO: DB integration - Fetch all settings
      const mockSettings = [
        { key: 'site_name', value: 'Adelaide Fringe' },
        { key: 'maintenance_mode', value: false }
      ];

      return res.status(200).json({
        success: true,
        message: 'Settings retrieved successfully',
        data: mockSettings
      });
    } catch (err: unknown) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch settings',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Update a specific setting
   */
  async updateSetting(req: Request, res: Response) {
    try {
      // TODO: Ensure admin is authenticated
      const { key } = req.params;
      const validatedData = settingUpdateSchema.parse(req.body);
      
      // TODO: DB integration - Update setting
      const mockUpdatedSetting = {
        key,
        value: validatedData.value,
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        message: `Setting ${key} updated successfully`,
        data: mockUpdatedSetting
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
        message: 'Failed to update setting',
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  },

  /**
   * Get admin dashboard stats (new endpoint)
   */
  async getDashboardStats(req: Request, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Admin access required', error: null });
      }
      // TODO: Fetch real stats from the database
      const mockStats = {
        totalEvents: 42,
        totalBookings: 1234,
        totalRevenue: 56789.50,
        soldOutEvents: 7
      };
      return res.status(200).json({
        success: true,
        message: 'Dashboard stats retrieved',
        data: mockStats
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: err.message });
    }
  }
};
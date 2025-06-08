import { Request, Response } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User, UserRole } from '../../entities/User';

export const StaffController = {
  async listStaff(req: Request, res: Response): Promise<void> {
    const staffRepo = AppDataSource.getRepository(User);
    const staff = await staffRepo.find({ where: { role: UserRole.ADMIN } });
    res.json({ staff });
  },

  async getStaff(req: Request, res: Response): Promise<void> {
    const staffRepo = AppDataSource.getRepository(User);
    const staff = await staffRepo.findOne({ where: { id: req.params.id, role: UserRole.ADMIN } });
    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }
    res.json({ staff });
  },

  async createStaff(req: Request, res: Response): Promise<void> {
    const staffRepo = AppDataSource.getRepository(User);
    const { name, email, group, assignedEvent, status, password } = req.body;
    const staff = staffRepo.create({ 
      name, 
      email, 
      group, 
      assignedEvent, 
      status, 
      role: UserRole.ADMIN, 
      password 
    });
    await staffRepo.save(staff);
    res.status(201).json({ staff });
  },

  async updateStaff(req: Request, res: Response): Promise<void> {
    const staffRepo = AppDataSource.getRepository(User);
    const staff = await staffRepo.findOne({ where: { id: req.params.id, role: UserRole.ADMIN } });
    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }
    Object.assign(staff, req.body);
    await staffRepo.save(staff);
    res.json({ staff });
  },

  async deleteStaff(req: Request, res: Response): Promise<void> {
    const staffRepo = AppDataSource.getRepository(User);
    const staff = await staffRepo.findOne({ where: { id: req.params.id, role: UserRole.ADMIN } });
    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }
    await staffRepo.remove(staff);
    res.json({ message: 'Staff deleted' });
  },

  async updateGroup(req: Request, res: Response): Promise<void> {
    const staffRepo = AppDataSource.getRepository(User);
    const staff = await staffRepo.findOne({ where: { id: req.params.id, role: UserRole.ADMIN } });
    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }
    staff.group = req.body.group;
    await staffRepo.save(staff);
    res.json({ staff });
  },

  async updateAssignedEvent(req: Request, res: Response): Promise<void> {
    const staffRepo = AppDataSource.getRepository(User);
    const staff = await staffRepo.findOne({ where: { id: req.params.id, role: UserRole.ADMIN } });
    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }
    staff.assignedEvent = req.body.assignedEvent;
    await staffRepo.save(staff);
    res.json({ staff });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const staffRepo = AppDataSource.getRepository(User);
    const staff = await staffRepo.findOne({ where: { id: req.params.id, role: UserRole.ADMIN } });
    if (!staff) {
      res.status(404).json({ message: 'Staff not found' });
      return;
    }
    staff.status = req.body.status;
    await staffRepo.save(staff);
    res.json({ staff });
  },
}; 
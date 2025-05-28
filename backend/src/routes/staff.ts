import { Router } from 'express';
import { StaffController } from '../controllers/admin/StaffController';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '../entities/User';

const router = Router();
const adminOnly = [requireAuth, requireRole([UserRole.ADMIN])];

router.get('/', ...adminOnly, StaffController.listStaff);
router.get('/:id', ...adminOnly, StaffController.getStaff);
router.post('/', ...adminOnly, StaffController.createStaff);
router.put('/:id', ...adminOnly, StaffController.updateStaff);
router.delete('/:id', ...adminOnly, StaffController.deleteStaff);
router.patch('/:id/group', ...adminOnly, StaffController.updateGroup);
router.patch('/:id/event', ...adminOnly, StaffController.updateAssignedEvent);
router.patch('/:id/status', ...adminOnly, StaffController.updateStatus);

export default router; 
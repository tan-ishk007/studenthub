import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { adminDashboard, toggleAdminRole, deleteUser } from '../controllers/adminController.js';

const router = express.Router();

router.get('/admin', requireAuth, requireAdmin, adminDashboard);
router.put('/admin/users/:id/role', requireAuth, requireAdmin, toggleAdminRole);
router.delete('/admin/users/:id', requireAuth, requireAdmin, deleteUser);

export default router;

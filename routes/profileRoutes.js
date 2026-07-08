import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { showProfile, updateName, updatePassword } from '../controllers/profileController.js';

const router = express.Router();

router.get('/profile', requireAuth, showProfile);
router.put('/profile', requireAuth, updateName);
router.put('/profile/password', requireAuth, updatePassword);

export default router;

import express from 'express';
import {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  logout,
} from '../controllers/authController.js';
import { validateRegister, validateLogin, handleValidationErrors } from '../middleware/validators.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/register', getRegister);
router.post('/register', registerLimiter, validateRegister, handleValidationErrors, postRegister);
router.get('/login', getLogin);
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, postLogin);
router.post('/logout', logout);

export default router;

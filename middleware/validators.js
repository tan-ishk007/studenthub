import { body, validationResult } from 'express-validator';
import { allowedEmails } from '../config/allowedEmails.js';

export const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom((value) => {
      if (!allowedEmails.includes(value)) {
        throw new Error('This email is not authorized to register');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateResource = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('category')
    .isIn(['Notes', 'PYQs', 'Books', 'Assignments', 'Coding', 'Lab Files', 'Others'])
    .withMessage('Please select a valid category'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    req.flash('error', messages.join(' '));
    return res.redirect('back');
  }
  next();
};

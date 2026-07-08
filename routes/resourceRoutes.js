import express from 'express';
import upload from '../config/cloudinary.js';
import { requireAuth, requireOwnership } from '../middleware/authMiddleware.js';
import {
  listResources,
  newResourceForm,
  createResource,
  showResource,
  downloadResource,
  editResourceForm,
  updateResource,
  deleteResource,
  myResources,
} from '../controllers/resourceController.js';
import { validateResource, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

router.get('/resources', listResources);
router.get('/resources/new', requireAuth, newResourceForm);
router.post('/resources', requireAuth, upload.single('file'), validateResource, handleValidationErrors, createResource);
router.get('/resources/:id', showResource);
router.get('/resources/:id/download', downloadResource);
router.get('/resources/:id/edit', requireAuth, requireOwnership, editResourceForm);
router.put('/resources/:id', requireAuth, requireOwnership, upload.single('file'), validateResource, handleValidationErrors, updateResource);
router.delete('/resources/:id', requireAuth, requireOwnership, deleteResource);
router.get('/my-resources', requireAuth, myResources);

export default router;

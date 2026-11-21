import { Router } from 'express';
import multer from 'multer';
import {
  uploadResume,
  listResumes,
  getResume,
  updateResume,
  deleteResume
} from '../controllers/resumes.controller.js';
import { standardWriteLimiter, generalReadLimiter } from '../middleware/rateLimiter.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const router = Router();

router.post('/', standardWriteLimiter, upload.single('file'), uploadResume);
router.get('/', generalReadLimiter, listResumes);
router.get('/:id', generalReadLimiter, getResume);
router.patch('/:id', standardWriteLimiter, updateResume);
router.delete('/:id', standardWriteLimiter, deleteResume);

export default router;

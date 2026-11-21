import { Router } from 'express';
import { z } from 'zod';
import {
  createJobDescription,
  listJobDescriptions,
  getJobDescription,
  updateJobDescription,
  deleteJobDescription
} from '../controllers/jobs.controller.js';
import { validate } from '../middleware/validate.js';
import { standardWriteLimiter, generalReadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const createJdSchema = {
  body: z.object({
    title: z.string().min(1, 'Job title is required').max(150),
    company: z.string().optional().default(''),
    experience_level: z.string().optional().default(''),
    location: z.string().optional().default(''),
    description: z.string().min(50, 'Job description must be at least 50 characters')
  })
};

router.post('/', standardWriteLimiter, validate(createJdSchema), createJobDescription);
router.get('/', generalReadLimiter, listJobDescriptions);
router.get('/:id', generalReadLimiter, getJobDescription);
router.patch('/:id', standardWriteLimiter, updateJobDescription);
router.delete('/:id', standardWriteLimiter, deleteJobDescription);

export default router;

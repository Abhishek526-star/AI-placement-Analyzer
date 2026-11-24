import { Router } from 'express';
import { z } from 'zod';
import { getProfile, updateProfile, deleteAccount } from '../controllers/profile.controller.js';
import { validate } from '../middleware/validate.js';
import { standardWriteLimiter, generalReadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const updateProfileSchema = {
  body: z.object({
    full_name: z.string().max(100, 'Name too long').optional().or(z.literal('')),
    course: z.string().max(100, 'Course name too long').optional().or(z.literal('')),
    branch: z.string().max(100, 'Branch name too long').optional().or(z.literal('')),
    year: z.string().max(50, 'Year too long').optional().or(z.literal('')),
    college: z.string().max(150, 'College name too long').optional().or(z.literal(''))
  })
};

router.get('/', generalReadLimiter, getProfile);
router.patch('/', standardWriteLimiter, validate(updateProfileSchema), updateProfile);
router.delete('/', standardWriteLimiter, deleteAccount);

export default router;

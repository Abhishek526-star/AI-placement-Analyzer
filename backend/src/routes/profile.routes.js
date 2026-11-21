import { Router } from 'express';
import { z } from 'zod';
import { getProfile, updateProfile, deleteAccount } from '../controllers/profile.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { standardWriteLimiter, generalReadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const updateProfileSchema = {
  body: z.object({
    full_name: z.string().min(1, 'Full name cannot be empty').max(100, 'Name too long')
  })
};

router.get('/profile', authMiddleware, generalReadLimiter, getProfile);
router.patch('/profile', authMiddleware, standardWriteLimiter, validate(updateProfileSchema), updateProfile);
router.delete('/profile', authMiddleware, standardWriteLimiter, deleteAccount);

export default router;

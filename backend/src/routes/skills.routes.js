import { Router } from 'express';
import { listSkills } from '../controllers/skills.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { generalReadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/skills', authMiddleware, generalReadLimiter, listSkills);

export default router;

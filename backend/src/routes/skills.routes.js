import { Router } from 'express';
import { listSkills } from '../controllers/skills.controller.js';
import { generalReadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/', generalReadLimiter, listSkills);

export default router;

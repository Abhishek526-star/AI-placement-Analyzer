import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { generalReadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/summary', generalReadLimiter, getDashboardSummary);

export default router;

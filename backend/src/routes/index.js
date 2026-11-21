import { Router } from 'express';
import healthRoutes from './health.routes.js';
import profileRoutes from './profile.routes.js';
import skillsRoutes from './skills.routes.js';
import resumesRoutes from './resumes.routes.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes
router.use(healthRoutes);

// Protected routes (require valid Supabase JWT)
router.use('/profile', authMiddleware, profileRoutes);
router.use('/skills', authMiddleware, skillsRoutes);
router.use('/resumes', authMiddleware, resumesRoutes);

export default router;

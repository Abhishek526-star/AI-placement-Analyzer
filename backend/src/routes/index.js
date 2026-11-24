import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import skillsRoutes from './skills.routes.js';
import resumesRoutes from './resumes.routes.js';
import jobsRoutes from './jobs.routes.js';
import analysesRoutes from './analyses.routes.js';
import careerIntelligenceRoutes from './careerIntelligence.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes
router.use(healthRoutes);
router.use('/auth', authRoutes);

// Protected routes (require valid Supabase JWT)
router.use('/profile', authMiddleware, profileRoutes);
router.use('/skills', authMiddleware, skillsRoutes);
router.use('/resumes', authMiddleware, resumesRoutes);
router.use('/jobs', authMiddleware, jobsRoutes);
router.use('/analyses', authMiddleware, analysesRoutes);
router.use('/analyses', authMiddleware, careerIntelligenceRoutes);
router.use('/career-intelligence', authMiddleware, careerIntelligenceRoutes);
router.use('/dashboard', authMiddleware, dashboardRoutes);

export default router;

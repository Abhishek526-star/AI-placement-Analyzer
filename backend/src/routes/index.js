import { Router } from 'express';
import healthRoutes from './health.routes.js';
import profileRoutes from './profile.routes.js';
import skillsRoutes from './skills.routes.js';

const router = Router();

router.use(healthRoutes);
router.use(profileRoutes);
router.use(skillsRoutes);

export default router;

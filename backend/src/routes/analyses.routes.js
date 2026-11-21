import { Router } from 'express';
import { z } from 'zod';
import {
  createAnalysis,
  listAnalyses,
  getAnalysis,
  deleteAnalysis
} from '../controllers/analyses.controller.js';
import { validate } from '../middleware/validate.js';
import { analysisTriggerLimiter, generalReadLimiter, standardWriteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const createAnalysisSchema = {
  body: z.object({
    resume_id: z.string().uuid('Valid resume_id UUID is required'),
    job_description_id: z.string().uuid('Valid job_description_id UUID is required'),
    title: z.string().optional()
  })
};

router.post('/', analysisTriggerLimiter, validate(createAnalysisSchema), createAnalysis);
router.get('/', generalReadLimiter, listAnalyses);
router.get('/:id', generalReadLimiter, getAnalysis);
router.delete('/:id', standardWriteLimiter, deleteAnalysis);

export default router;

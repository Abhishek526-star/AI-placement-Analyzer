import { Router } from 'express';
import {
  getOrGenerateInterviewQuestions,
  getOrGenerateRoadmap,
  getOrGenerateResumeSuggestions
} from '../controllers/careerIntelligence.controller.js';
import { analysisTriggerLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/:id/interview-questions', analysisTriggerLimiter, getOrGenerateInterviewQuestions);
router.post('/:id/roadmap', analysisTriggerLimiter, getOrGenerateRoadmap);
router.post('/:id/resume-suggestions', analysisTriggerLimiter, getOrGenerateResumeSuggestions);

export default router;

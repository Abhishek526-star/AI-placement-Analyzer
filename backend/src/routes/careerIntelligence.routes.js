import { Router } from 'express';
import {
  getOrGenerateInterviewQuestions,
  getOrGenerateRoadmap,
  getOrGenerateResumeSuggestions
} from '../controllers/careerIntelligence.controller.js';
import { careerIntelligenceLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Dedicated limiter so tab navigation never consumes the heavy analysis creation quota
router.post('/:id/interview-questions', careerIntelligenceLimiter, getOrGenerateInterviewQuestions);
router.post('/:id/roadmap', careerIntelligenceLimiter, getOrGenerateRoadmap);
router.post('/:id/resume-suggestions', careerIntelligenceLimiter, getOrGenerateResumeSuggestions);

export default router;

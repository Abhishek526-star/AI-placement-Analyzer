import { Router } from 'express';
import {
  getOrGenerateInterviewQuestions,
  getOrGenerateRoadmap,
  getOrGenerateResumeSuggestions,
  evaluateInterviewAnswer,
  rescoreResumeBullet,
  saveResumeBullet
} from '../controllers/careerIntelligence.controller.js';
import { careerIntelligenceLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Dedicated limiter so tab navigation never consumes the heavy analysis creation quota
router.post('/:id/interview-questions', careerIntelligenceLimiter, getOrGenerateInterviewQuestions);
router.post('/:id/roadmap', careerIntelligenceLimiter, getOrGenerateRoadmap);
router.post('/:id/resume-suggestions', careerIntelligenceLimiter, getOrGenerateResumeSuggestions);
router.post('/:id/evaluate-answer', careerIntelligenceLimiter, evaluateInterviewAnswer);
router.post('/:id/rescore-bullet', careerIntelligenceLimiter, rescoreResumeBullet);
router.post('/:id/save-bullet', careerIntelligenceLimiter, saveResumeBullet);

export default router;

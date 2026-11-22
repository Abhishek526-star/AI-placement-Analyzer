import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

export const generalReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 500 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
        retryable: true
      },
      meta: {
        request_id: req.id || 'req_unknown',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export const standardWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 150 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many write requests. Please try again in a moment.',
        retryable: true
      },
      meta: {
        request_id: req.id || 'req_unknown',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Limiter for creating brand-new match analyses (POST /api/v1/analyses).
 * High limit in development (200/hr) so testing is never blocked.
 * Production defaults to 25/hr (or custom configured via env).
 */
export const analysisTriggerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : (parseInt(process.env.RATE_LIMIT_ANALYSES_PER_HOUR, 10) || 25),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'ANALYSIS_RATE_LIMIT_EXCEEDED',
        message: isDev
          ? 'Development analysis limit reached (200/hr). Please wait a moment.'
          : 'Hourly analysis limit reached. Please try again later.',
        retryable: true
      },
      meta: {
        request_id: req.id || 'req_unknown',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Dedicated limiter for career intelligence tabs (Interview Prep, Roadmap, Resume Suggestions).
 * Separate from new analysis creation so switching tabs never consumes the analysis creation quota.
 */
export const careerIntelligenceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 120 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'CAREER_INTELLIGENCE_RATE_LIMIT_EXCEEDED',
        message: 'Too many requests for career prep data. Please wait a moment before switching tabs.',
        retryable: true
      },
      meta: {
        request_id: req.id || 'req_unknown',
        timestamp: new Date().toISOString()
      }
    });
  }
});

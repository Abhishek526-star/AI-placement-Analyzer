import rateLimit from 'express-rate-limit';

export const generalReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
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
  max: 30,
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

export const analysisTriggerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'ANALYSIS_RATE_LIMIT_EXCEEDED',
        message: 'Analysis limit reached (10 per hour). Please try again later.',
        retryable: true
      },
      meta: {
        request_id: req.id || 'req_unknown',
        timestamp: new Date().toISOString()
      }
    });
  }
});

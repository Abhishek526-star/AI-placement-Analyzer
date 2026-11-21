import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null, retryable = false) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

export function globalErrorHandler(err, req, res, _next) {
  const reqId = req.id || 'req_unknown';

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data.',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          issue: e.message
        })),
        retryable: false
      },
      meta: {
        request_id: reqId,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        retryable: err.retryable
      },
      meta: {
        request_id: reqId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Catch-all unhandled exceptions
  console.error(`[UnhandledError] [${reqId}]:`, err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      retryable: true
    },
    meta: {
      request_id: reqId,
      timestamp: new Date().toISOString()
    }
  });
}

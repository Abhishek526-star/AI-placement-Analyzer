import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { globalErrorHandler, AppError } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// 1. Request ID Middleware
app.use(requestId);

// 2. HTTP Request Logger (omits PII)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms [req_id: :res[x-request-id]]'));
}

// 3. Security Headers via Helmet
app.use(helmet());

// 4. Strict CORS Configuration
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
  })
);

// 5. Body Parser with 100kb limit (DoS protection)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Placement Analyzer API is running',
    environment: env.NODE_ENV
  });
});


// 6. Versioned API Routes (/api/v1)
app.use('/api/v1', apiRoutes);

// 7. 404 Route Handler
app.use((req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404, 'NOT_FOUND'));
});

// 8. Global Error Handler Envelope
app.use(globalErrorHandler);

export default app;

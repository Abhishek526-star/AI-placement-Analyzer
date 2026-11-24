import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { getServiceClient } from '../config/supabase.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { standardWriteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const registerSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().max(100).optional().or(z.literal(''))
  })
};

router.post('/register', standardWriteLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;
    const serviceClient = getServiceClient();

    // Create user via admin API with email confirmed immediately (bypasses SMTP rate limits)
    const { data, error } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || '' }
    });

    if (error) {
      if (error.message?.includes('already been registered') || error.code === 'user_already_exists') {
        return next(new AppError('A candidate account with this email already exists.', 409, 'USER_EXISTS'));
      }
      return next(new AppError(error.message, 400, 'REGISTRATION_FAILED'));
    }

    return sendSuccess(req, res, { user: data.user, auto_confirmed: true }, 201);
  } catch (err) {
    next(err);
  }
});

export default router;

import { AppError } from './errorHandler.js';
import { getServiceClient, getUserClient } from '../config/supabase.js';

export async function authMiddleware(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Authentication required. Invalid token format.', 401, 'UNAUTHORIZED'));
    }

    const serviceClient = getServiceClient();
    const { data: { user }, error } = await serviceClient.auth.getUser(token);

    if (error || !user) {
      return next(new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN'));
    }

    req.user = {
      id: user.id,
      email: user.email || ''
    };

    // User-scoped client for automatic RLS enforcement
    req.supabase = getUserClient(token);

    next();
  } catch (error) {
    next(new AppError('Authentication failed.', 401, 'AUTH_FAILED'));
  }
}

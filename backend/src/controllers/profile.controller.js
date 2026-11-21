import { sendSuccess } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { getServiceClient } from '../config/supabase.js';

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const client = req.supabase || getServiceClient();

    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, email, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return sendSuccess(req, res, {
        id: userId,
        full_name: '',
        email: req.user.email,
        created_at: new Date().toISOString()
      });
    }

    return sendSuccess(req, res, data);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { full_name } = req.body;
    const client = req.supabase || getServiceClient();

    const { data, error } = await client
      .from('profiles')
      .update({ full_name })
      .eq('id', userId)
      .select('id, full_name, email, created_at, updated_at')
      .single();

    if (error) {
      return next(new AppError('Failed to update profile.', 500, 'PROFILE_UPDATE_FAILED'));
    }

    return sendSuccess(req, res, data);
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const serviceClient = getServiceClient();

    // 1. Delete user files from private Supabase Storage bucket 'resumes'
    try {
      const { data: files } = await serviceClient.storage
        .from('resumes')
        .list(userId);

      if (files && files.length > 0) {
        const filesToRemove = files.map((f) => `${userId}/${f.name}`);
        await serviceClient.storage.from('resumes').remove(filesToRemove);
      }
    } catch (storageErr) {
      console.warn(`[StorageCleanup] Failed to clean bucket for user ${userId}:`, storageErr);
    }

    // 2. Delete user from auth.users (cascades to all 12 tables)
    const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);
    if (authError) {
      return next(new AppError('Failed to delete user account.', 500, 'ACCOUNT_DELETION_FAILED'));
    }

    return sendSuccess(req, res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

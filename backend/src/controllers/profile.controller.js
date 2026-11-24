import { sendSuccess } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { getServiceClient } from '../config/supabase.js';

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const serviceClient = getServiceClient();
    const client = req.supabase || serviceClient;

    // 1. Fetch from profiles table
    let profileData = null;
    try {
      const { data } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      profileData = data;
    } catch {
      // ignore
    }

    // 2. Fetch auth user metadata for fallback / rich metadata
    let userMeta = {};
    try {
      const { data: authUser } = await serviceClient.auth.admin.getUserById(userId);
      if (authUser?.user?.user_metadata) {
        userMeta = authUser.user.user_metadata;
      }
    } catch {
      // ignore
    }

    const merged = {
      id: userId,
      full_name: profileData?.full_name || userMeta.full_name || '',
      email: profileData?.email || req.user.email || userMeta.email || '',
      course: profileData?.course || userMeta.course || '',
      branch: profileData?.branch || userMeta.branch || '',
      year: profileData?.year || userMeta.year || '',
      college: profileData?.college || userMeta.college || '',
      created_at: profileData?.created_at || req.user.created_at || new Date().toISOString(),
      updated_at: profileData?.updated_at || new Date().toISOString()
    };

    return sendSuccess(req, res, merged);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { full_name, course, branch, year, college } = req.body;
    const serviceClient = getServiceClient();
    const client = req.supabase || serviceClient;

    // 1. Update profiles table (try with academic fields first, fallback to full_name if columns not in table yet)
    let updatedProfile = null;
    const academicPayload = {
      full_name: full_name !== undefined ? full_name : undefined,
      course: course !== undefined ? course : undefined,
      branch: branch !== undefined ? branch : undefined,
      year: year !== undefined ? year : undefined,
      college: college !== undefined ? college : undefined
    };

    // Clean undefined fields
    const cleanPayload = Object.fromEntries(
      Object.entries(academicPayload).filter(([_, v]) => v !== undefined)
    );

    const { data, error } = await client
      .from('profiles')
      .update(cleanPayload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      // If error is due to missing columns in profiles table (e.g. 42703), fallback to updating full_name only
      if (error.code === '42703' || error.message?.includes('column')) {
        const { data: fallbackData } = await client
          .from('profiles')
          .update({ full_name: full_name || '' })
          .eq('id', userId)
          .select('id, full_name, email, created_at, updated_at')
          .single();
        updatedProfile = fallbackData;
      } else {
        return next(new AppError('Failed to update profile.', 500, 'PROFILE_UPDATE_FAILED'));
      }
    } else {
      updatedProfile = data;
    }

    // 2. Persist to auth user_metadata to ensure 100% persistence across sessions & auth context
    try {
      const { data: authUser } = await serviceClient.auth.admin.getUserById(userId);
      const existingMeta = authUser?.user?.user_metadata || {};
      await serviceClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingMeta,
          full_name: full_name !== undefined ? full_name : existingMeta.full_name || '',
          course: course !== undefined ? course : existingMeta.course || '',
          branch: branch !== undefined ? branch : existingMeta.branch || '',
          year: year !== undefined ? year : existingMeta.year || '',
          college: college !== undefined ? college : existingMeta.college || ''
        }
      });
    } catch (metaErr) {
      console.warn('Could not sync user_metadata in auth:', metaErr);
    }

    const result = {
      id: userId,
      full_name: updatedProfile?.full_name !== undefined ? updatedProfile.full_name : full_name || '',
      email: updatedProfile?.email || req.user.email,
      course: updatedProfile?.course !== undefined ? updatedProfile.course : (course || ''),
      branch: updatedProfile?.branch !== undefined ? updatedProfile.branch : (branch || ''),
      year: updatedProfile?.year !== undefined ? updatedProfile.year : (year || ''),
      college: updatedProfile?.college !== undefined ? updatedProfile.college : (college || ''),
      created_at: updatedProfile?.created_at || new Date().toISOString(),
      updated_at: updatedProfile?.updated_at || new Date().toISOString()
    };

    return sendSuccess(req, res, result);
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

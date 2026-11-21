import crypto from 'crypto';
import { parseJobDescription } from '../services/parser/jdParser.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { getServiceClient } from '../config/supabase.js';

export async function createJobDescription(req, res, next) {
  try {
    const userId = req.user.id;
    const client = req.supabase || getServiceClient();
    const { title, company, experience_level, location, description } = req.body;

    if (!title || !description) {
      return next(new AppError('Job title and description are required.', 400, 'MISSING_FIELDS'));
    }

    // 1. Parse JD and extract weighted requirements
    const { parsed_data, requirements } = parseJobDescription(description);

    const jdId = crypto.randomUUID();

    // 2. Insert into job_descriptions table
    const { data: jdRecord, error: jdErr } = await client
      .from('job_descriptions')
      .insert({
        id: jdId,
        user_id: userId,
        title,
        company: company || '',
        experience_level: experience_level || '',
        location: location || '',
        description,
        parsed_data
      })
      .select('id, title, company, experience_level, location, parsed_data, created_at')
      .single();

    if (jdErr) {
      console.error('[JdInsertError]:', jdErr);
      return next(new AppError('Failed to record job description.', 500, 'DB_INSERT_FAILED'));
    }

    // 3. Insert requirements into job_requirements table
    if (requirements.length > 0) {
      const reqRows = requirements.map((r) => ({
        job_description_id: jdId,
        user_id: userId,
        skill_name: r.skill_name,
        importance: r.importance,
        requirement_type: r.requirement_type,
        weight: r.weight,
        evidence_text: r.evidence_text
      }));

      await client.from('job_requirements').insert(reqRows);
    }

    return sendSuccess(req, res, {
      ...jdRecord,
      requirements
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listJobDescriptions(req, res, next) {
  try {
    const userId = req.user.id;
    const client = req.supabase || getServiceClient();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from('job_descriptions')
      .select('id, title, company, experience_level, location, created_at, updated_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return sendPaginated(req, res, [], { page, limit, total: 0, total_pages: 0 });
    }

    const total = count || 0;
    return sendPaginated(req, res, data || [], {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
}

export async function getJobDescription(req, res, next) {
  try {
    const userId = req.user.id;
    const jdId = req.params.id;
    const client = req.supabase || getServiceClient();

    const { data: jd, error: jdErr } = await client
      .from('job_descriptions')
      .select('*')
      .eq('id', jdId)
      .eq('user_id', userId)
      .single();

    if (jdErr || !jd) {
      return next(new AppError('Job description not found.', 404, 'JD_NOT_FOUND'));
    }

    const { data: requirements } = await client
      .from('job_requirements')
      .select('*')
      .eq('job_description_id', jdId);

    return sendSuccess(req, res, {
      ...jd,
      requirements: requirements || []
    });
  } catch (err) {
    next(err);
  }
}

export async function updateJobDescription(req, res, next) {
  try {
    const userId = req.user.id;
    const jdId = req.params.id;
    const client = req.supabase || getServiceClient();
    const { title, company, experience_level, location, description } = req.body;

    const updates = {};
    if (title) updates.title = title;
    if (company !== undefined) updates.company = company;
    if (experience_level !== undefined) updates.experience_level = experience_level;
    if (location !== undefined) updates.location = location;

    if (description) {
      updates.description = description;
      const { parsed_data, requirements } = parseJobDescription(description);
      updates.parsed_data = parsed_data;

      // Re-populate requirements
      await client.from('job_requirements').delete().eq('job_description_id', jdId).eq('user_id', userId);
      if (requirements.length > 0) {
        const reqRows = requirements.map((r) => ({
          job_description_id: jdId,
          user_id: userId,
          skill_name: r.skill_name,
          importance: r.importance,
          requirement_type: r.requirement_type,
          weight: r.weight,
          evidence_text: r.evidence_text
        }));
        await client.from('job_requirements').insert(reqRows);
      }
    }

    const { data: updatedJd, error } = await client
      .from('job_descriptions')
      .update(updates)
      .eq('id', jdId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      return next(new AppError('Failed to update job description.', 500, 'DB_UPDATE_FAILED'));
    }

    return sendSuccess(req, res, updatedJd);
  } catch (err) {
    next(err);
  }
}

export async function deleteJobDescription(req, res, next) {
  try {
    const userId = req.user.id;
    const jdId = req.params.id;
    const client = req.supabase || getServiceClient();

    await client.from('job_descriptions').delete().eq('id', jdId).eq('user_id', userId);

    return sendSuccess(req, res, { deleted_id: jdId });
  } catch (err) {
    next(err);
  }
}

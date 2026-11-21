import { sendSuccess } from '../utils/response.js';
import { getServiceClient } from '../config/supabase.js';

export async function listSkills(req, res, next) {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const client = req.supabase || getServiceClient();

    let dbQuery = client
      .from('skills')
      .select('id, canonical_name, category, aliases, description')
      .limit(limit);

    if (query) {
      dbQuery = dbQuery.ilike('canonical_name', `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      return sendSuccess(req, res, []);
    }

    return sendSuccess(req, res, data || []);
  } catch (err) {
    next(err);
  }
}

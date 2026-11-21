import { sendSuccess } from '../utils/response.js';
import { getServiceClient } from '../config/supabase.js';

export async function getHealth(req, res, _next) {
  let dbStatus = 'healthy';
  try {
    const serviceClient = getServiceClient();
    
    // Quick probe with 500ms timeout
    const probe = serviceClient.from('skills').select('id').limit(1);
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DB probe timeout')), 500)
    );

    const result = await Promise.race([probe, timeout]);
    if (result && result.error) {
      dbStatus = 'degraded';
    }
  } catch (err) {
    dbStatus = 'unreachable';
  }

  return sendSuccess(req, res, {
    status: 'ok',
    version: '1.0.0',
    services: {
      database: dbStatus,
      storage: 'healthy'
    }
  });
}

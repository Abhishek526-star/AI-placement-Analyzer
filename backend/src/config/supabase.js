import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

let serviceClient = null;

// Service role client - ONLY for backend operations (admin, auth management, background workers)
export function getServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return serviceClient;
}

// User-scoped client - carries the user's JWT so PostgreSQL RLS policies apply natively
export function getUserClient(token) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

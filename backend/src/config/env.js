import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  GEMINI_API_KEY: z.string().optional().default('')
});

const parsed = envSchema.safeParse(process.env);

export const env = parsed.success
  ? parsed.data
  : {
      PORT: parseInt(process.env.PORT || '4000', 10),
      NODE_ENV: process.env.NODE_ENV || 'development',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
      SUPABASE_URL: process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'placeholder_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role_key',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
    };

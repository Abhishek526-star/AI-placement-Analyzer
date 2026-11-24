
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),

  NODE_ENV: z.enum([
    'development',
    'production',
    'test'
  ]).default('development'),

  FRONTEND_URL: z.string().default('http://localhost:5173'),

  SUPABASE_URL: z.string().url(),

  SUPABASE_ANON_KEY: z.string().min(1),

  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  GEMINI_API_KEY: z.string().optional().default(''),

  GEMINI_EMBEDDING_MODEL: z.string().optional().default('gemini-embedding-001'),

  GEMINI_CHAT_MODEL: z.string().optional().default('')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

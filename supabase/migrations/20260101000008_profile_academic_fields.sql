-- ============================================================================
-- 8. PROFILES ACADEMIC & PLACEMENT FIELDS (Optional metadata)
-- ============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS course TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS college TEXT;

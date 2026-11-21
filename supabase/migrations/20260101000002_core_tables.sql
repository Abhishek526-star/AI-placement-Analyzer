BEGIN;

-- ============================================================================
-- 1. PROFILES (Mirrors auth.users via trigger)
-- ============================================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. SKILLS (Canonical Skill Dictionary for Normalization - FR-06)
-- ============================================================================
CREATE TABLE public.skills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name  TEXT NOT NULL UNIQUE,
  category        TEXT NOT NULL,
  aliases         JSONB NOT NULL DEFAULT '[]'::jsonb,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_skills_aliases_is_array CHECK (jsonb_typeof(aliases) = 'array')
);

-- ============================================================================
-- 3. RESUMES (Uploaded File Metadata & Raw Extracted Text - FR-02, FR-03)
-- ============================================================================
CREATE TABLE public.resumes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename        TEXT NOT NULL,
  storage_path    TEXT NOT NULL UNIQUE,
  file_type       public.resume_file_type NOT NULL,
  mime_type       TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_hash       TEXT,
  extracted_text  TEXT,
  parsing_status  public.parsing_status NOT NULL DEFAULT 'uploading',
  parsing_error   TEXT,
  version         INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_resumes_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  CONSTRAINT chk_resumes_version_positive CHECK (version >= 1)
);

-- ============================================================================
-- 4. RESUME_PROFILES (Structured Extracted Data & User Edits - FR-03, FR-04)
-- ============================================================================
CREATE TABLE public.resume_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id             UUID NOT NULL UNIQUE REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parsed_data           JSONB NOT NULL DEFAULT '{}'::jsonb,
  extraction_confidence NUMERIC(4, 3),
  is_user_confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_resume_profiles_confidence CHECK (
    extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)
  ),
  CONSTRAINT chk_resume_profiles_parsed_object CHECK (jsonb_typeof(parsed_data) = 'object')
);

-- ============================================================================
-- 5. RESUME_SKILLS (Normalized Skills Extracted from Resume - FR-03, FR-06)
-- ============================================================================
CREATE TABLE public.resume_skills (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id           UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canonical_skill_id  UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  skill_name          TEXT NOT NULL,
  evidence_text       TEXT NOT NULL,
  section             TEXT NOT NULL DEFAULT 'general',
  confidence          NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
  is_user_added       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_resume_skills_confidence CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT uq_resume_skill_section UNIQUE (resume_id, skill_name, section)
);

-- ============================================================================
-- 6. JOB_DESCRIPTIONS (User-Submitted Target JDs - FR-05)
-- ============================================================================
CREATE TABLE public.job_descriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  company           TEXT,
  experience_level  TEXT,
  location          TEXT,
  description       TEXT NOT NULL,
  parsed_data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_jd_description_non_empty CHECK (char_length(trim(description)) >= 20),
  CONSTRAINT chk_jd_parsed_object CHECK (jsonb_typeof(parsed_data) = 'object')
);

-- ============================================================================
-- 7. JOB_REQUIREMENTS (Weighted JD Skills & Requirements - FR-05, FR-08)
-- ============================================================================
CREATE TABLE public.job_requirements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description_id  UUID NOT NULL REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id            UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  skill_name          TEXT NOT NULL,
  importance          public.requirement_importance NOT NULL DEFAULT 'required',
  requirement_type    public.requirement_type NOT NULL DEFAULT 'technical_skill',
  weight              NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  evidence_text       TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_job_req_weight_positive CHECK (weight > 0)
);

COMMIT;

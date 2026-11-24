BEGIN;

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- 2. CUSTOM ENUM TYPES
-- ============================================================================

-- Supported resume file formats (FR-02)
CREATE TYPE public.resume_file_type AS ENUM (
  'pdf',
  'docx'
);

-- Resume ingestion & parsing lifecycle (FR-02)
CREATE TYPE public.parsing_status AS ENUM (
  'uploading',
  'processing',
  'parsed',
  'needs_review',
  'failed'
);

-- Importance level of a requirement in a JD (FR-05, FR-07)
CREATE TYPE public.requirement_importance AS ENUM (
  'required',
  'preferred',
  'nice_to_have'
);

-- Classification of extracted JD requirements (FR-05)
CREATE TYPE public.requirement_type AS ENUM (
  'technical_skill',
  'tool_technology',
  'domain_knowledge',
  'soft_skill',
  'education',
  'experience'
);

-- Deterministic & hybrid skill match outcomes (FR-07)
CREATE TYPE public.skill_match_status AS ENUM (
  'matched',
  'partially_matched',
  'missing',
  'uncertain'
);

-- Asynchronous analysis execution states (Section 17)
CREATE TYPE public.analysis_status AS ENUM (
  'queued',
  'processing',
  'completed',
  'failed'
);

-- Informational alignment labels derived from deterministic score (FR-08)
CREATE TYPE public.alignment_level AS ENUM (
  'strong',
  'moderate',
  'partial',
  'low'
);

-- Document source types stored in vector chunks (Section 8)
CREATE TYPE public.document_source_type AS ENUM (
  'resume',
  'job_description'
);

-- Categories for generated interview questions (FR-11)
CREATE TYPE public.interview_question_category AS ENUM (
  'technical_fundamentals',
  'coding_dsa',
  'project_deep_dive',
  'technology_specific',
  'scenario_based',
  'behavioral_hr'
);

-- Difficulty levels for interview questions (FR-11)
CREATE TYPE public.question_difficulty AS ENUM (
  'easy',
  'medium',
  'hard'
);

COMMIT;
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
BEGIN;

-- ============================================================================
-- 1. ANALYSES (Core Match Record, Deterministic Score & Grounded AI Output)
-- ============================================================================
CREATE TABLE public.analyses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id           UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  resume_version      INTEGER NOT NULL DEFAULT 1,
  job_description_id  UUID NOT NULL REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  title               TEXT,
  status              public.analysis_status NOT NULL DEFAULT 'queued',
  current_step        TEXT,
  error_message       TEXT,

  -- Deterministic Scoring Fields (FR-08)
  match_score         NUMERIC(5, 2),
  alignment_level     public.alignment_level,
  score_breakdown     JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Validated Structured AI Output (Section 9)
  analysis_result     JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Model & Prompt Versioning for Reproducibility
  model_version       TEXT,
  prompt_version      TEXT,
  schema_version      TEXT NOT NULL DEFAULT '1.0',
  processing_time_ms  INTEGER,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_analyses_match_score CHECK (
    match_score IS NULL OR (match_score >= 0 AND match_score <= 100)
  ),
  CONSTRAINT chk_analyses_processing_time CHECK (
    processing_time_ms IS NULL OR processing_time_ms >= 0
  ),
  CONSTRAINT chk_analyses_breakdown_object CHECK (jsonb_typeof(score_breakdown) = 'object'),
  CONSTRAINT chk_analyses_result_object CHECK (jsonb_typeof(analysis_result) = 'object')
);

-- ============================================================================
-- 2. ANALYSIS_SKILL_MATCHES (Per-Skill Evidence & Scoring - FR-07, FR-09)
-- ============================================================================
CREATE TABLE public.analysis_skill_matches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id           UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id              UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  skill_name            TEXT NOT NULL,
  jd_importance         public.requirement_importance NOT NULL,
  status                public.skill_match_status NOT NULL,
  weight                NUMERIC(5, 2) NOT NULL,
  score                 NUMERIC(5, 2) NOT NULL,
  confidence            NUMERIC(4, 3),
  priority_rank         INTEGER,
  resume_evidence       JSONB NOT NULL DEFAULT '[]'::jsonb,
  jd_evidence           JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation           TEXT,
  recommended_next_step TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_skill_matches_weight CHECK (weight > 0),
  CONSTRAINT chk_skill_matches_score CHECK (score >= 0 AND score <= weight),
  CONSTRAINT chk_skill_matches_confidence CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
  ),
  CONSTRAINT chk_skill_matches_resume_ev_array CHECK (jsonb_typeof(resume_evidence) = 'array'),
  CONSTRAINT chk_skill_matches_jd_ev_array CHECK (jsonb_typeof(jd_evidence) = 'array')
);

-- ============================================================================
-- 3. DOCUMENT_CHUNKS (pgvector + Full-Text Search for Hybrid RAG - Section 8)
-- ============================================================================
CREATE TABLE public.document_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id     UUID NOT NULL,
  document_type   public.document_source_type NOT NULL,
  section         TEXT NOT NULL,
  chunk_index     INTEGER NOT NULL,
  page_number     INTEGER,
  chunk_text      TEXT NOT NULL,
  embedding       VECTOR(768),
  fts             TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_chunks_index_non_negative CHECK (chunk_index >= 0),
  CONSTRAINT chk_chunks_page_positive CHECK (page_number IS NULL OR page_number >= 1),
  CONSTRAINT chk_chunks_metadata_object CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT uq_document_chunk_order UNIQUE (document_id, document_type, chunk_index)
);

-- ============================================================================
-- 4. INTERVIEW_QUESTIONS (Role-Specific Questions per Analysis - FR-11)
-- ============================================================================
CREATE TABLE public.interview_questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id         UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question            TEXT NOT NULL,
  category            public.interview_question_category NOT NULL,
  difficulty          public.question_difficulty NOT NULL,
  why_relevant        TEXT,
  related_skill       TEXT,
  answer_outline      TEXT,
  follow_up_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_iq_followups_array CHECK (jsonb_typeof(follow_up_questions) = 'array')
);

-- ============================================================================
-- 5. LEARNING_ROADMAPS (Dependency-Ordered Preparation Plan - FR-12)
-- ============================================================================
CREATE TABLE public.learning_roadmaps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL UNIQUE REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap     JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_roadmap_is_array CHECK (jsonb_typeof(roadmap) = 'array')
);

COMMIT;
BEGIN;

-- ============================================================================
-- 1. B-TREE INDEXES (Foreign Keys, Dashboard, & History Pagination)
-- ============================================================================
CREATE INDEX idx_resumes_user_created
  ON public.resumes (user_id, created_at DESC);

CREATE INDEX idx_resumes_user_hash
  ON public.resumes (user_id, file_hash)
  WHERE file_hash IS NOT NULL;

CREATE INDEX idx_resume_skills_resume
  ON public.resume_skills (resume_id);

CREATE INDEX idx_resume_skills_canonical
  ON public.resume_skills (canonical_skill_id)
  WHERE canonical_skill_id IS NOT NULL;

CREATE INDEX idx_job_descriptions_user_created
  ON public.job_descriptions (user_id, created_at DESC);

CREATE INDEX idx_job_requirements_jd
  ON public.job_requirements (job_description_id);

CREATE INDEX idx_analyses_user_created
  ON public.analyses (user_id, created_at DESC);

CREATE INDEX idx_analyses_resume_jd
  ON public.analyses (resume_id, job_description_id);

-- Partial index for fast polling of active background jobs
CREATE INDEX idx_analyses_active_jobs
  ON public.analyses (status, created_at ASC)
  WHERE status IN ('queued', 'processing');

CREATE INDEX idx_analysis_skill_matches_analysis
  ON public.analysis_skill_matches (analysis_id);

CREATE INDEX idx_interview_questions_analysis
  ON public.interview_questions (analysis_id);

-- ============================================================================
-- 2. GIN INDEXES (Skill Alias Lookups & Full-Text Hybrid Search)
-- ============================================================================
CREATE INDEX idx_skills_aliases_gin
  ON public.skills USING GIN (aliases);

CREATE INDEX idx_document_chunks_fts_gin
  ON public.document_chunks USING GIN (fts);

-- ============================================================================
-- 3. RAG METADATA & PGVECTOR HNSW INDEX
-- ============================================================================
CREATE INDEX idx_document_chunks_user_doc
  ON public.document_chunks (user_id, document_id, document_type);

-- HNSW index for fast approximate nearest neighbor search using Cosine Distance
CREATE INDEX idx_document_chunks_embedding_hnsw
  ON public.document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMIT;
BEGIN;

-- ============================================================================
-- 1. AUTOMATIC updated_at TIMESTAMP TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_resume_profiles_updated_at
  BEFORE UPDATE ON public.resume_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_job_descriptions_updated_at
  BEFORE UPDATE ON public.job_descriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_learning_roadmaps_updated_at
  BEFORE UPDATE ON public.learning_roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. SYNC NEW SUPABASE AUTH USERS TO public.profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. ORPHAN CHUNK CLEANUP TRIGGERS (Polymorphic Integrity for document_chunks)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_resume_chunks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.document_chunks
  WHERE document_id = OLD.id
    AND document_type = 'resume';
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_cleanup_resume_chunks
  AFTER DELETE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_resume_chunks();

CREATE OR REPLACE FUNCTION public.cleanup_jd_chunks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.document_chunks
  WHERE document_id = OLD.id
    AND document_type = 'job_description';
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_cleanup_jd_chunks
  AFTER DELETE ON public.job_descriptions
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_jd_chunks();

-- ============================================================================
-- 4. GROUNDED VECTOR RETRIEVAL RPC (With Cosine Similarity Threshold)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding       VECTOR(768),
  filter_user_id        UUID,
  filter_document_id    UUID,
  filter_document_type  public.document_source_type,
  match_threshold       FLOAT DEFAULT 0.65,
  match_count           INT DEFAULT 8
)
RETURNS TABLE (
  id          UUID,
  section     TEXT,
  chunk_text  TEXT,
  page_number INTEGER,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    dc.id,
    dc.section,
    dc.chunk_text,
    dc.page_number,
    dc.metadata,
    (1 - (dc.embedding <=> query_embedding))::FLOAT AS similarity
  FROM public.document_chunks dc
  WHERE dc.user_id = filter_user_id
    AND dc.document_id = filter_document_id
    AND dc.document_type = filter_document_type
    AND dc.embedding IS NOT NULL
    AND (1 - (dc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY dc.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

-- ============================================================================
-- 5. HYBRID RETRIEVAL RPC (Semantic Vector + Keyword FTS via RRF)
--    Prevents missing exact acronyms like 'JWT', 'SQL', 'C++', 'AWS S3'
-- ============================================================================
CREATE OR REPLACE FUNCTION public.hybrid_match_document_chunks(
  query_text            TEXT,
  query_embedding       VECTOR(768),
  filter_user_id        UUID,
  filter_document_id    UUID,
  filter_document_type  public.document_source_type,
  match_count           INT DEFAULT 8,
  min_vector_similarity FLOAT DEFAULT 0.55,
  full_text_weight      FLOAT DEFAULT 1.0,
  semantic_weight       FLOAT DEFAULT 1.0,
  rrf_k                 INT DEFAULT 50
)
RETURNS TABLE (
  id                UUID,
  section           TEXT,
  chunk_text        TEXT,
  page_number       INTEGER,
  metadata          JSONB,
  vector_similarity FLOAT,
  hybrid_score      FLOAT
)
LANGUAGE sql
STABLE
AS $$
  WITH semantic_search AS (
    SELECT
      dc.id,
      (1 - (dc.embedding <=> query_embedding))::FLOAT AS sim,
      ROW_NUMBER() OVER (ORDER BY dc.embedding <=> query_embedding ASC) AS rank_ix
    FROM public.document_chunks dc
    WHERE dc.user_id = filter_user_id
      AND dc.document_id = filter_document_id
      AND dc.document_type = filter_document_type
      AND dc.embedding IS NOT NULL
      AND (1 - (dc.embedding <=> query_embedding)) >= min_vector_similarity
    ORDER BY dc.embedding <=> query_embedding ASC
    LIMIT match_count * 2
  ),
  keyword_search AS (
    SELECT
      dc.id,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(dc.fts, websearch_to_tsquery('english', query_text)) DESC
      ) AS rank_ix
    FROM public.document_chunks dc
    WHERE dc.user_id = filter_user_id
      AND dc.document_id = filter_document_id
      AND dc.document_type = filter_document_type
      AND dc.fts @@ websearch_to_tsquery('english', query_text)
    LIMIT match_count * 2
  )
  SELECT
    dc.id,
    dc.section,
    dc.chunk_text,
    dc.page_number,
    dc.metadata,
    COALESCE(ss.sim, 0.0)::FLOAT AS vector_similarity,
    (
      COALESCE(1.0 / (rrf_k + ks.rank_ix), 0.0) * full_text_weight +
      COALESCE(1.0 / (rrf_k + ss.rank_ix), 0.0) * semantic_weight
    )::FLOAT AS hybrid_score
  FROM public.document_chunks dc
  LEFT JOIN semantic_search ss ON dc.id = ss.id
  LEFT JOIN keyword_search ks ON dc.id = ks.id
  WHERE ss.id IS NOT NULL OR ks.id IS NOT NULL
  ORDER BY hybrid_score DESC
  LIMIT match_count;
$$;

COMMIT;
BEGIN;

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_skill_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmaps ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. TABLE POLICIES
-- ============================================================================

-- Profiles: users can view, insert, and update only their own profile
CREATE POLICY "profiles_owner_all"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Skills dictionary: read-only for authenticated users; writes via service_role only
CREATE POLICY "skills_authenticated_read"
  ON public.skills
  FOR SELECT
  TO authenticated
  USING (true);

-- Resumes
CREATE POLICY "resumes_owner_all"
  ON public.resumes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Resume Profiles
CREATE POLICY "resume_profiles_owner_all"
  ON public.resume_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Resume Skills
CREATE POLICY "resume_skills_owner_all"
  ON public.resume_skills
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Job Descriptions
CREATE POLICY "job_descriptions_owner_all"
  ON public.job_descriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Job Requirements
CREATE POLICY "job_requirements_owner_all"
  ON public.job_requirements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Analyses
CREATE POLICY "analyses_owner_all"
  ON public.analyses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Analysis Skill Matches
CREATE POLICY "analysis_skill_matches_owner_all"
  ON public.analysis_skill_matches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Document Chunks
CREATE POLICY "document_chunks_owner_all"
  ON public.document_chunks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Interview Questions
CREATE POLICY "interview_questions_owner_all"
  ON public.interview_questions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Learning Roadmaps
CREATE POLICY "learning_roadmaps_owner_all"
  ON public.learning_roadmaps
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. PRIVATE SUPABASE STORAGE BUCKET ('resumes')
--    Files must be stored at path: {user_id}/{resume_id}.{pdf|docx}
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10 MB limit (FR-02)
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "resumes_storage_owner_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resumes_storage_owner_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resumes_storage_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resumes_storage_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

COMMIT;
BEGIN;

INSERT INTO public.skills (canonical_name, category, aliases, description) VALUES
  ('JavaScript', 'Programming Language', '["JS", "Javascript", "ECMAScript", "ES6", "ES6+"]'::jsonb, 'Core scripting language for web development.'),
  ('TypeScript', 'Programming Language', '["TS", "Typescript"]'::jsonb, 'Statically typed superset of JavaScript.'),
  ('Python', 'Programming Language', '["Python 3", "Python3", "Py"]'::jsonb, 'General-purpose programming language widely used in backend and AI.'),
  ('Java', 'Programming Language', '["Core Java", "Java 8", "Java 17", "JDK"]'::jsonb, 'Object-oriented programming language for enterprise backends.'),
  ('C++', 'Programming Language', '["CPP", "C Plus Plus"]'::jsonb, 'Systems and competitive programming language.'),
  ('React', 'Frontend', '["ReactJS", "React.js", "React 18", "React 19"]'::jsonb, 'Component-based JavaScript UI library.'),
  ('Next.js', 'Frontend', '["NextJS", "Next"]'::jsonb, 'Full-stack React framework with SSR and routing.'),
  ('Tailwind CSS', 'Frontend', '["Tailwind", "TailwindCSS"]'::jsonb, 'Utility-first CSS framework.'),
  ('Node.js', 'Backend', '["Node", "NodeJS", "Node JS"]'::jsonb, 'JavaScript runtime built on Chrome V8 engine.'),
  ('Express.js', 'Backend', '["Express", "ExpressJS"]'::jsonb, 'Minimalist web framework for Node.js.'),
  ('Spring Boot', 'Backend', '["SpringBoot", "Spring"]'::jsonb, 'Java-based framework for production microservices and APIs.'),
  ('FastAPI', 'Backend', '["Fast API"]'::jsonb, 'Modern Python web framework for building APIs.'),
  ('REST API Development', 'Backend', '["REST", "RESTful API", "RESTful APIs", "REST APIs"]'::jsonb, 'Designing and implementing RESTful HTTP services.'),
  ('SQL', 'Database', '["Structured Query Language", "RDBMS"]'::jsonb, 'Relational database querying and schema design.'),
  ('PostgreSQL', 'Database', '["Postgres", "PG", "psql"]'::jsonb, 'Open-source object-relational database system.'),
  ('MongoDB', 'Database', '["Mongo", "Mongo DB"]'::jsonb, 'NoSQL document-oriented database.'),
  ('Redis', 'Database', '["Redis Cache"]'::jsonb, 'In-memory key-value data store for caching and queues.'),
  ('Git', 'DevOps & Tools', '["GitHub", "GitLab", "Version Control"]'::jsonb, 'Distributed version control system.'),
  ('Docker', 'DevOps & Tools', '["Containerization", "Docker Compose"]'::jsonb, 'Platform for developing and running containerized applications.'),
  ('AWS', 'Cloud', '["Amazon Web Services", "AWS S3", "AWS EC2", "AWS Lambda"]'::jsonb, 'Cloud computing services platform.')
ON CONFLICT (canonical_name) DO UPDATE SET
  category = EXCLUDED.category,
  aliases = EXCLUDED.aliases,
  description = EXCLUDED.description;

COMMIT;


-- ============================================================================
-- 8. PROFILES ACADEMIC & PLACEMENT FIELDS (Optional metadata)
-- ============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS course TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS college TEXT;

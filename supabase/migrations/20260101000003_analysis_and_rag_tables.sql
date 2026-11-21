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

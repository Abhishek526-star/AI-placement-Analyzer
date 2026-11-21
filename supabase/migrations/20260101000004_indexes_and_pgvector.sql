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

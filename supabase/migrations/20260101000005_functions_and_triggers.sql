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

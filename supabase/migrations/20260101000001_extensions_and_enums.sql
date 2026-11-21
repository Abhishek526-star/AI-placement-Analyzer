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

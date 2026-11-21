# AI Placement Analyzer — REST API Design Specification

**Version:** `v1`  
**Base URL:** `/api/v1`  
**Backend Stack:** Node.js + Express + Zod + Supabase (Auth, PostgreSQL, Storage)  
**Aligned With:** `prd.md` (v1.0) & `database.md`

---

## 1. API Conventions & Standards

### 1.1 Authentication
All `/api/v1/*` endpoints (except `/api/v1/health`) require a valid Supabase Auth JWT in the `Authorization` header:

```http
Authorization: Bearer <supabase_access_token>
```

* The backend validates the JWT via Supabase Auth middleware and attaches `req.user = { id, email }`.
* **Security Rule:** `user_id` is **always** derived from `req.user.id`, never from the request body or query params.

### 1.2 Standard Response Envelope
Every response uses a consistent JSON structure with a server-generated `request_id` for tracing (never logging raw resume content).

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req_01J8X9K2M4",
    "timestamp": "2026-01-15T10:30:00.000Z"
  }
}
```

**Paginated List Response:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "total_pages": 5
  },
  "meta": {
    "request_id": "req_01J8X9K2M4",
    "timestamp": "2026-01-15T10:30:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only PDF and DOCX files up to 10 MB are supported.",
    "details": [
      { "field": "file", "issue": "Detected MIME type image/png is not allowed." }
    ],
    "retryable": false
  },
  "meta": {
    "request_id": "req_01J8X9K2M4",
    "timestamp": "2026-01-15T10:30:00.000Z"
  }
}
```

### 1.3 Rate Limiting & Request Limits
| Endpoint Group | Rate Limit (per user) | Max Payload Size |
| :--- | :--- | :--- |
| General Read (`GET`) | 100 req / min | N/A |
| Standard Write (`POST`, `PATCH`, `DELETE`) | 30 req / min | 100 KB (JSON) |
| Resume Upload (`POST /resumes`) | 5 req / 15 min | 10 MB (`multipart/form-data`) |
| AI / Analysis Triggers (`POST /analyses*`) | 10 req / hour | 100 KB (JSON) |

Rate-limited responses return `429 Too Many Requests` with `Retry-After` header.

---

## 2. System & Profile Endpoints

### 2.1 Health Check
* **Route:** `GET /api/v1/health`
* **Auth:** Public
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "services": {
      "database": "healthy",
      "storage": "healthy"
    }
  }
}
```

### 2.2 Get & Update User Profile
* **Route:** `GET /api/v1/profile`
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "Aarav Sharma",
    "email": "aarav@example.com",
    "created_at": "2026-01-10T08:00:00Z"
  }
}
```

* **Route:** `PATCH /api/v1/profile`
* **Request Body:**
```json
{
  "full_name": "Aarav K. Sharma"
}
```
* **Response (`200 OK`):** Updated profile object.

### 2.3 Delete User Account (FR-01, Section 13)
* **Route:** `DELETE /api/v1/profile`
* **Behavior:**
  1. Deletes all user resume files from private Supabase Storage bucket (`resumes/{user_id}/*`).
  2. Deletes user from `auth.users` via Supabase Admin API (cascades to all DB tables).
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": { "deleted": true }
}
```

### 2.4 Dashboard Summary (FR-14)
* **Route:** `GET /api/v1/dashboard/summary`
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "total_analyses": 6,
    "active_resume": {
      "id": "uuid",
      "filename": "Aarav_Resume_2026.pdf",
      "parsing_status": "parsed",
      "is_user_confirmed": true,
      "skills_count": 14,
      "updated_at": "2026-01-14T12:00:00Z"
    },
    "latest_analysis": {
      "id": "uuid",
      "title": "Frontend Developer - Acme Corp",
      "match_score": 72.5,
      "alignment_level": "moderate",
      "status": "completed",
      "created_at": "2026-01-15T09:00:00Z"
    },
    "top_matched_skills": ["React", "JavaScript", "Node.js", "SQL"],
    "top_skill_gaps": ["TypeScript", "Docker", "AWS"],
    "recent_analyses": [
      {
        "id": "uuid",
        "title": "Frontend Developer - Acme Corp",
        "company": "Acme Corp",
        "match_score": 72.5,
        "alignment_level": "moderate",
        "status": "completed",
        "created_at": "2026-01-15T09:00:00Z"
      }
    ]
  }
}
```

### 2.5 Canonical Skills Lookup (FR-06)
* **Route:** `GET /api/v1/skills?q=react&limit=20`
* **Purpose:** Autocomplete when users review/add skills on their parsed resume.
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "canonical_name": "React",
      "category": "Frontend",
      "aliases": ["ReactJS", "React.js"]
    }
  ]
}
```

---

## 3. Resume APIs (FR-02, FR-03, FR-04)

### 3.1 Upload Resume
* **Route:** `POST /api/v1/resumes`
* **Content-Type:** `multipart/form-data`
* **Form Fields:**
  * `file` (required): PDF or DOCX binary, max 10 MB.
* **Server Validation:**
  * Verify file magic bytes/signature (not just file extension).
  * Reject empty, encrypted, or corrupted documents.
  * Compute SHA-256 `file_hash` to warn/handle duplicate uploads.
  * Upload to private bucket at `{user_id}/{resume_id}.{ext}`.
  * Trigger parsing, structured extraction, skill normalization, chunking, and embedding generation.
* **Response (`201 Created` or `202 Accepted` if async parsing):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "Aarav_Resume_2026.pdf",
    "file_type": "pdf",
    "file_size_bytes": 245120,
    "parsing_status": "processing",
    "version": 1,
    "is_duplicate": false,
    "created_at": "2026-01-15T10:00:00Z"
  }
}
```

### 3.2 List User Resumes
* **Route:** `GET /api/v1/resumes?page=1&limit=10`
* **Response (`200 OK`):** Paginated list of resume metadata records (excludes raw `extracted_text` for bandwidth).

### 3.3 Get Resume Details & Parsed Profile
* **Route:** `GET /api/v1/resumes/:id?include_signed_url=false`
* **Behavior:** If `include_signed_url=true`, generates a short-lived (e.g., 60-second) Supabase Storage signed URL for preview.
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "Aarav_Resume_2026.pdf",
    "file_type": "pdf",
    "parsing_status": "parsed",
    "parsing_error": null,
    "version": 1,
    "signed_url": null,
    "profile": {
      "is_user_confirmed": false,
      "extraction_confidence": 0.91,
      "parsed_data": {
        "contact": { "full_name": "Aarav Sharma", "email": "aarav@example.com" },
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "achievements": []
      }
    },
    "skills": [
      {
        "id": "uuid",
        "canonical_skill_id": "uuid",
        "skill_name": "React",
        "evidence_text": "Built a responsive dashboard using React and Tailwind CSS.",
        "section": "projects",
        "confidence": 0.96,
        "is_user_added": false
      }
    ],
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:12Z"
  }
}
```

### 3.4 Review & Update Parsed Resume Profile (FR-04)
* **Route:** `PATCH /api/v1/resumes/:id`
* **Purpose:** Allows the user to correct extracted fields, add/remove skills, and confirm the profile without altering the original uploaded file. Increments `version` and refreshes affected `document_chunks` if text fields change.
* **Request Body:**
```json
{
  "is_user_confirmed": true,
  "parsed_data": {
    "contact": { "full_name": "Aarav Sharma", "email": "aarav@example.com" },
    "education": [
      { "degree": "B.Tech CSE", "institution": "XYZ Institute", "graduation_year": 2026 }
    ],
    "projects": [
      {
        "name": "AI Placement Analyzer",
        "description": "RAG-based resume analyzer using pgvector.",
        "technologies": ["React", "Node.js", "PostgreSQL"]
      }
    ]
  },
  "skills_upsert": [
    {
      "skill_name": "PostgreSQL",
      "section": "projects",
      "evidence_text": "Designed relational schema and pgvector HNSW indexes in PostgreSQL."
    }
  ],
  "skill_ids_delete": ["uuid-of-false-positive-skill"]
}
```
* **Response (`200 OK`):** Updated resume details + incremented `version`.

### 3.5 Reprocess Resume
* **Route:** `POST /api/v1/resumes/:id/reprocess`
* **Purpose:** Re-runs PDF/DOCX text extraction, structured parsing, skill extraction, and `document_chunks` embedding generation from the stored original file.
* **Response (`202 Accepted`):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "parsing_status": "processing"
  }
}
```

### 3.6 Delete Resume
* **Route:** `DELETE /api/v1/resumes/:id`
* **Behavior:** Deletes file from Supabase Storage and deletes row in `resumes` (triggers auto-cleanup of `document_chunks` and cascades `resume_profiles`, `resume_skills`, and linked `analyses`).
* **Response (`200 OK`):** `{ "success": true, "data": { "deleted_id": "uuid" } }`

---

## 4. Job Description APIs (FR-05, FR-06)

### 4.1 Create & Parse Job Description
* **Route:** `POST /api/v1/jobs`
* **Request Body:**
```json
{
  "title": "Software Engineer - Frontend",
  "company": "Acme Corp",
  "experience_level": "Entry Level (0-2 years)",
  "location": "Bengaluru, India",
  "description": "We are looking for a Frontend Engineer proficient in React, TypeScript, REST APIs, and SQL..."
}
```
* **Validation:** `description` must be at least 50 characters (rejects `JD_TOO_SHORT`).
* **Behavior:** Extracts structured JD fields, normalizes skills into `job_requirements` with deterministic weights, chunks JD sections, and stores embeddings in `document_chunks`.
* **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Software Engineer - Frontend",
    "company": "Acme Corp",
    "experience_level": "Entry Level (0-2 years)",
    "location": "Bengaluru, India",
    "parsed_data": {
      "required_skills": ["React", "TypeScript", "SQL"],
      "preferred_skills": ["Docker"],
      "responsibilities": ["Build accessible React interfaces"],
      "experience_requirements": "0-2 years"
    },
    "requirements": [
      {
        "id": "uuid",
        "skill_id": "uuid",
        "skill_name": "React",
        "importance": "required",
        "requirement_type": "technical_skill",
        "weight": 20.0,
        "evidence_text": "proficient in React, TypeScript..."
      }
    ],
    "created_at": "2026-01-15T10:15:00Z"
  }
}
```

### 4.2 List Job Descriptions
* **Route:** `GET /api/v1/jobs?page=1&limit=10&search=frontend`
* **Response (`200 OK`):** Paginated list of saved JDs.

### 4.3 Get Job Description Details
* **Route:** `GET /api/v1/jobs/:id`
* **Response (`200 OK`):** Full JD record including `parsed_data` and `requirements`.

### 4.4 Update Job Description
* **Route:** `PATCH /api/v1/jobs/:id`
* **Request Body:** Any subset of `{ title, company, experience_level, location, description }`. If `description` changes, requirements and chunks are re-extracted.
* **Response (`200 OK`):** Updated JD record.

### 4.5 Delete Job Description
* **Route:** `DELETE /api/v1/jobs/:id`
* **Behavior:** Deletes JD record (triggers `document_chunks` cleanup and cascades `job_requirements` and linked `analyses`).
* **Response (`200 OK`):** `{ "success": true, "data": { "deleted_id": "uuid" } }`

---

## 5. Analysis APIs (FR-07, FR-08, FR-09, FR-13, FR-15)

### 5.1 Start New Analysis (Asynchronous Pipeline)
* **Route:** `POST /api/v1/analyses`
* **Request Body:**
```json
{
  "resume_id": "uuid",
  "job_description_id": "uuid",
  "title": "Acme Corp - Frontend Role (Optional)"
}
```
* **Pre-checks:**
  * Verifies ownership of both `resume_id` and `job_description_id`.
  * Ensures resume `parsing_status` is `parsed` or `needs_review` (cannot analyze `failed` or `uploading`).
* **Pipeline Stages (`current_step`):**
  1. `skill_matching` — Deterministic exact/alias + semantic matching and weighted score calculation.
  2. `evidence_retrieval` — Hybrid retrieval (`hybrid_match_document_chunks`) with similarity thresholds.
  3. `ai_analysis` — Grounded Gemini LLM call with untrusted-document prompt isolation.
  4. `validation` — Zod schema check + citation/chunk ID verification + abstention enforcement.
* **Response (`202 Accepted`):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "queued",
    "current_step": "queued",
    "resume_id": "uuid",
    "resume_version": 1,
    "job_description_id": "uuid",
    "created_at": "2026-01-15T10:20:00Z"
  }
}
```

### 5.2 List Analysis History (FR-13)
* **Route:** `GET /api/v1/analyses?page=1&limit=10&status=completed&sort=created_at:desc`
* **Response (`200 OK`):** Paginated summary list of user's analyses with `title`, `match_score`, `alignment_level`, `status`, `resume_filename`, `job_title`, `company`, and `created_at`.

### 5.3 Get Analysis Details & Poll Status
* **Route:** `GET /api/v1/analyses/:id`
* **Polling Behavior:** Frontend polls every 2–3 seconds while `status` is `queued` or `processing`.
* **Response (`200 OK` — Completed):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Acme Corp - Frontend Role",
    "status": "completed",
    "current_step": "completed",
    "error_message": null,
    "resume": {
      "id": "uuid",
      "filename": "Aarav_Resume_2026.pdf",
      "version": 1
    },
    "job_description": {
      "id": "uuid",
      "title": "Software Engineer - Frontend",
      "company": "Acme Corp"
    },
    "match_score": 65.0,
    "alignment_level": "moderate",
    "score_breakdown": {
      "total_weight": 100,
      "earned_weight": 65,
      "matched_count": 4,
      "partially_matched_count": 0,
      "missing_count": 2,
      "uncertain_count": 0
    },
    "summary": {
      "role": "Software Engineer - Frontend",
      "overall_alignment": "moderate",
      "strengths": ["Demonstrated React and SQL usage across two projects."],
      "limitations": ["No resume evidence found for TypeScript or Docker."]
    },
    "skill_matches": [
      {
        "id": "uuid",
        "skill_name": "React",
        "jd_importance": "required",
        "status": "matched",
        "weight": 20,
        "score": 20,
        "confidence": 0.95,
        "priority_rank": null,
        "resume_evidence": [
          { "chunk_id": "uuid-chunk-1", "quote": "Developed a React application with Redux..." }
        ],
        "jd_evidence": [
          { "chunk_id": "uuid-jd-2", "quote": "Proficient in React and modern JS." }
        ],
        "explanation": "Resume explicitly demonstrates React development in a production project.",
        "recommended_next_step": "Prepare to discuss React rendering lifecycle and state management."
      },
      {
        "id": "uuid",
        "skill_name": "TypeScript",
        "jd_importance": "required",
        "status": "missing",
        "weight": 20,
        "score": 0,
        "confidence": 0.92,
        "priority_rank": 1,
        "resume_evidence": [],
        "jd_evidence": [
          { "chunk_id": "uuid-jd-2", "quote": "Strong command of TypeScript." }
        ],
        "explanation": "No evidence of TypeScript found in the uploaded resume.",
        "recommended_next_step": "Migrate one existing React project from JS to strict TypeScript."
      }
    ],
    "resume_suggestions": [],
    "limitations": [
      "Insufficient context to assess production cloud deployment experience."
    ],
    "has_interview_questions": false,
    "has_learning_roadmap": false,
    "model_version": "gemini-2.5-flash",
    "prompt_version": "v1.0.0",
    "processing_time_ms": 8420,
    "created_at": "2026-01-15T10:20:00Z"
  }
}
```

### 5.4 Rename Analysis (FR-13)
* **Route:** `PATCH /api/v1/analyses/:id`
* **Request Body:** `{ "title": "Dream Frontend Role - Round 1" }`
* **Response (`200 OK`):** Updated analysis metadata.

### 5.5 Retry Failed Analysis
* **Route:** `POST /api/v1/analyses/:id/retry`
* **Pre-check:** Allowed only when `status === 'failed'`. Resets `status` to `queued` and clears `error_message`.
* **Response (`202 Accepted`):** `{ "success": true, "data": { "id": "uuid", "status": "queued" } }`

### 5.6 Delete Analysis
* **Route:** `DELETE /api/v1/analyses/:id`
* **Response (`200 OK`):** `{ "success": true, "data": { "deleted_id": "uuid" } }`

---

## 6. AI Career Intelligence Endpoints (FR-10, FR-11, FR-12)

All endpoints below require the parent analysis to have `status === 'completed'`. If already generated, they return cached database results unless `{ "regenerate": true }` is explicitly passed.

### 6.1 Generate / Fetch Interview Questions (FR-11)
* **Route:** `POST /api/v1/analyses/:id/interview-questions`
* **Request Body (optional):**
```json
{
  "count": 15,
  "categories": ["technical_fundamentals", "project_deep_dive", "coding_dsa", "behavioral_hr"],
  "regenerate": false
}
```
* **Validation:** `count` between `10` and `20` (default `15`).
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "analysis_id": "uuid",
    "questions": [
      {
        "id": "uuid",
        "question": "In your AI Placement Analyzer project, how did you prevent pgvector from returning irrelevant resume chunks?",
        "category": "project_deep_dive",
        "difficulty": "medium",
        "why_relevant": "Tests depth on your primary listed project and JD requirement for backend reliability.",
        "related_skill": "PostgreSQL",
        "answer_outline": "Discuss cosine similarity thresholding, metadata filtering by user_id/document_id, and hybrid FTS+vector search.",
        "follow_up_questions": [
          "How would you evaluate retrieval precision quantitatively?",
          "Why choose HNSW over IVFFlat for this dataset size?"
        ]
      }
    ]
  }
}
```

### 6.2 Generate / Fetch Learning Roadmap (FR-12)
* **Route:** `POST /api/v1/analyses/:id/roadmap`
* **Request Body (optional):**
```json
{
  "regenerate": false
}
```
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "analysis_id": "uuid",
    "disclaimer": "Estimated learning durations are approximate and depend on your prior background.",
    "roadmap": [
      {
        "sequence": 1,
        "topic": "TypeScript Fundamentals & React Typing",
        "priority": "high",
        "reason": "Required by JD; high weight (20%) and currently missing from resume.",
        "dependencies": ["JavaScript", "React"],
        "practice_task": "Convert your portfolio or dashboard repo to TypeScript with strict mode enabled.",
        "expected_outcome": "Type-safe React components, API payloads, and custom hooks.",
        "estimated_effort": "1-2 weeks"
      }
    ]
  }
}
```

### 6.3 Generate / Fetch Resume Improvement Suggestions (FR-10)
* **Route:** `POST /api/v1/analyses/:id/resume-suggestions`
* **Request Body (optional):**
```json
{
  "regenerate": false
}
```
* **Grounding Rule:** Every suggestion is explicitly categorized as `improve_wording`, `highlight_existing_skill`, or `acquire_new_skill`, and tagged with `evidence_based`, `inferred`, or `general_guidance`. Never suggests fabricating experience.
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "analysis_id": "uuid",
    "suggestions": [
      {
        "category": "improve_wording",
        "classification": "evidence_based",
        "section": "projects",
        "target_quote": "Built a web app using React and Node.js.",
        "source_chunk_ids": ["uuid-chunk-3"],
        "suggestion": "Specify concrete technical details and measurable outcomes (e.g., API latency, number of endpoints, or auth mechanism) that you actually implemented."
      },
      {
        "category": "acquire_new_skill",
        "classification": "evidence_based",
        "section": "skills",
        "target_quote": null,
        "source_chunk_ids": ["uuid-jd-2"],
        "suggestion": "TypeScript is a required skill for this role and is not present in your resume. Build a small TypeScript project before adding it."
      }
    ]
  }
}
```

---

## 7. Standardized Error Codes (PRD Section 15)

| HTTP Status | Error Code | Trigger Condition | `retryable` |
| :--- | :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Zod schema validation failed on body/query/params | `false` |
| `400` | `INVALID_FILE_TYPE` | Unsupported MIME type or failed magic-byte check | `false` |
| `400` | `FILE_TOO_LARGE` | Uploaded file exceeds 10 MB | `false` |
| `400` | `EMPTY_OR_CORRUPT_FILE` | 0-byte file, corrupt archive, or encrypted PDF | `false` |
| `400` | `SCANNED_PDF_UNREADABLE` | PDF has no extractable text layer (image-only scan) | `false` |
| `400` | `JD_TOO_SHORT` | Job description text lacks sufficient content (< 50 chars) | `false` |
| `400` | `NO_REQUIREMENTS_FOUND` | Parser could not identify any skills/requirements in JD | `false` |
| `401` | `UNAUTHORIZED` | Missing, expired, or invalid Supabase JWT | `false` |
| `403` | `FORBIDDEN` | User attempted to access a resource they do not own | `false` |
| `404` | `RESOURCE_NOT_FOUND` | Requested resume, JD, or analysis ID does not exist | `false` |
| `409` | `INVALID_STATE` | e.g., Starting analysis on an unparsed resume, or retrying a completed analysis | `false` |
| `429` | `RATE_LIMIT_EXCEEDED` | User exceeded API or AI generation quota | `true` |
| `502` | `AI_PROVIDER_ERROR` | Gemini LLM or Embedding API returned an upstream error | `true` |
| `502` | `AI_OUTPUT_VALIDATION_FAILED` | LLM returned malformed JSON or failed citation checks after retry | `true` |
| `503` | `SERVICE_UNAVAILABLE` | Supabase DB, pgvector, or Storage temporarily unreachable | `true` |
| `504` | `AI_TIMEOUT` | LLM or embedding call exceeded timeout threshold | `true` |
| `500` | `INTERNAL_SERVER_ERROR` | Unhandled server exception (stack trace logged server-side only) | `true` |

---

## 8. Express Middleware Stack Order

To ensure security and consistent observability across all routes, mount middleware in this exact order:

1. `requestIdMiddleware` — Generates `req.id` (`req_...`) and attaches `X-Request-Id` response header.
2. `helmet()` & `cors()` — Strict origin whitelist (`FRONTEND_URL`) and security headers.
3. `express.json({ limit: '100kb' })` — Prevents oversized JSON payloads.
4. `authMiddleware` — Verifies Supabase JWT, sets `req.user`, and initializes a user-scoped Supabase client so RLS is enforced.
5. `rateLimitMiddleware` — Route-specific quotas keyed by `req.user.id`.
6. `validate(zodSchema)` — Validates `req.body`, `req.query`, and `req.params`.
7. Route Controller — Executes deterministic logic / service calls.
8. `globalErrorHandler` — Maps Zod errors, Multer errors, Supabase errors, and custom `AppError` instances into the standard Error Envelope without leaking stack traces.
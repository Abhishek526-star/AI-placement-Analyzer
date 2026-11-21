# AI Placement Analyzer

**An evidence-first Resume-to-JD Gap Analysis & Interview Preparation platform built with deterministic skill matching, hybrid RAG (`pgvector` + Full-Text Search), and programmatic citation verification.**

> Unlike generic "ChatGPT resume wrappers," AI Placement Analyzer calculates match scores deterministically in application code, grounds every AI claim in verified document chunks, and explicitly abstains (`insufficient_evidence`) instead of guessing or fabricating experience.

---

## Why This Project Exists

Students and early-career developers preparing for placements often struggle to answer:
* *Does my resume actually match this Job Description?*
* *Which required skills are missing, and what should I learn first?*
* *What technical and project-specific questions will an interviewer ask me?*

Most AI resume tools either return opaque scores or hallucinate skills the candidate never listed. **AI Placement Analyzer** separates **deterministic logic** (parsing, canonical skill normalization, weighted scoring) from **grounded AI synthesis** (gap explanations, honest resume suggestions, role-specific interview questions, and learning roadmaps).

---

## Key Features

* **Secure Resume Ingestion & Review:** Upload PDF or DOCX resumes (up to 10 MB) with magic-byte validation, private storage, structured profile extraction, and a split-pane UI to review and confirm extracted data.
* **Canonical Skill Normalization:** Maps aliases (`JS` -> `JavaScript`, `Postgres` -> `PostgreSQL`, `Node JS` -> `Node.js`) via a canonical skill dictionary without falsely merging unrelated technologies (`Java` vs. `JavaScript`).
* **Transparent, Deterministic Match Scoring:** Computes weighted compatibility scores ($0\text{--}100$) in application code using:
  $$\text{Match Score} = \left(\frac{\sum \text{Earned Weighted Requirements}}{\sum \text{All Weighted Requirements}}\right) \times 100$$
* **Hybrid RAG & Evidence Explorer:** Combines `pgvector` HNSW cosine similarity with PostgreSQL `tsvector` full-text search (Reciprocal Rank Fusion) so exact technical acronyms (`C++`, `JWT`, `SQL`, `AWS S3`) are never missed. Every matched skill links to verbatim resume and JD quotes.
* **Honest Resume Suggestions:** Explicitly categorizes feedback into *Improve Wording*, *Highlight Existing Skill*, and *Acquire New Skill*—never recommending fabricated experience.
* **Role-Specific Interview Prep & Learning Roadmap:** Generates 10–20 targeted questions across 6 categories (including project deep-dives grounded in your actual resume) and a dependency-ordered preparation roadmap.
* **Analysis History & Privacy Controls:** Save, rename, revisit, and delete analyses, or delete your entire account with cascading database and storage cleanup.

---

## System Architecture

```text
Frontend (React + Vite + Tailwind + shadcn/ui)
        |
        v  (HTTPS + Supabase JWT)
Backend API (Node.js + Express + Zod)
        |
        +---- Supabase Auth (JWT Verification)
        +---- Supabase Storage (Private 'resumes' Bucket, 60s Signed URLs)
        +---- PostgreSQL 15+ (RLS Enforced on All 12 Tables)
        |         ├── Relational Data (Resumes, JDs, Skills, Analyses)
        |         └── document_chunks (pgvector HNSW + tsvector FTS)
        |
        +---- Document Parser (PDF / DOCX + Magic-Byte Validation)
        +---- Deterministic Engine (Normalizer, Matcher, Weighted Scorer)
        +---- Hybrid RAG Pipeline (Chunker -> Embeddings -> RRF Retrieval)
        +---- Grounded LLM Service (Gemini API + 3-Stage Citation Verifier)
```

---

## Production Reliability: Controlling Hallucinations & Retrieval Failures

1. **Deterministic Score Lock:** The LLM never computes or overrides the numeric match score or skill weights.
2. **Hybrid Retrieval + Similarity Thresholds:** `hybrid_match_document_chunks` filters strictly by `user_id` and `document_id`, fuses vector + keyword search, and drops chunks below similarity cutoffs (`0.55` hybrid / `0.65` semantic). If zero chunks qualify, the pipeline short-circuits to `missing` / `insufficient_evidence`.
3. **Indirect Prompt Injection Defense:** All retrieved resume and JD chunks are isolated inside `<untrusted_resume_chunks>` and `<untrusted_jd_chunks>` XML tags with strict system-prompt instructions to ignore embedded commands.
4. **3-Stage Verification Gate:** Every LLM response passes (1) Zod runtime schema validation, (2) programmatic `chunk_id` and verbatim quote verification against the supplied context, and (3) max 1 repair retry before gracefully falling back to deterministic results.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, `shadcn/ui`, Lucide Icons |
| **Backend** | Node.js, Express, Zod, Multer |
| **Database & Vector Search** | Supabase PostgreSQL 15+, `pgvector` (HNSW), PostgreSQL FTS (`tsvector`) |
| **Auth & Storage** | Supabase Auth, Private Supabase Storage |
| **Document Parsing** | `pdf-parse` / `pdfjs-dist` (PDF), `mammoth` (DOCX) |
| **AI & Embeddings** | Gemini API (behind replaceable `AIProvider` interface, 768-dim embeddings) |
| **Testing** | Vitest, Supertest, Playwright, Custom Golden Dataset Eval Runner |
| **Deployment** | Vercel (Frontend) + Render (Backend) + Supabase (DB/Auth/Storage) |

---

## Repository Structure

```text
ai-placement-analyzer/
├── docs/                        # Architecture & planning specifications
├── supabase/
│   └── migrations/              # Numbered SQL migrations (001–007)
├── backend/
│   ├── src/
│   │   ├── config/              # Zod env validation, Supabase clients
│   │   ├── middleware/          # requestId, auth, rateLimit, validate, errorHandler
│   │   ├── routes/              # /api/v1 REST routes
│   │   ├── controllers/         # HTTP controllers
│   │   ├── services/
│   │   │   ├── parser/          # PDF/DOCX extraction, magic-byte check, section splitter
│   │   │   ├── skills/          # Normalizer, deterministic matcher, weighted scorer
│   │   │   ├── rag/             # Section-aware chunker, embedder, hybrid retriever
│   │   │   └── ai/              # Provider interface, Gemini client, prompts, verifier
│   │   ├── workers/             # Async analysis job runner
│   │   └── validators/          # Zod schemas for API requests & AI outputs
│   └── tests/                   # unit/, integration/, security/, eval/ (Golden Dataset)
└── frontend/
    └── src/
        ├── components/          # shadcn/ui + MatchScoreCard, EvidenceExplorer, etc.
        ├── pages/               # Landing, Auth, Dashboard, Upload, Review, Results, History
        ├── hooks/               # Auth, polling, and API hooks
        └── lib/                 # API client & Supabase browser client
```

---

## Documentation Index

* [`prd.md`](./prd.md) — Product Requirements Document, user personas, functional requirements, and MVP scope.
* [`schema.md`](./schema.md) — Logical ERD, table overview, and Zod-aligned JSONB contracts.
* [`database.md`](./database.md) — Ready-to-run PostgreSQL migrations (`001`–`007`), `pgvector` HNSW indexes, hybrid RPCs, and RLS policies.
* [`api-design.md`](./api-design.md) — `/api/v1` REST API contract, response envelopes, rate limits, and error codes.
* [`rag-architecture.md`](./rag-architecture.md) — Chunking strategy, hybrid retrieval, prompt injection defense, and 3-stage verification gate.
* [`design.md`](./design.md) — UI/UX design system, Tailwind tokens, 14-page specs, and accessibility checklist.
* [`security.md`](./security.md) — Threat model, RLS isolation, upload hardening, PII redaction, and security audit checklist.
* [`testing.md`](./testing.md) — 5-layer testing pyramid, Golden Dataset evaluation suite, and performance benchmarks.
* [`phase-implementation.md`](./phase-implementation.md) — 8-week phased build roadmap and exit gates.
* [`memory.md`](./memory.md) — Architectural Decision Records (ADRs), guardrails, and progress tracker.

---

## Local Development Setup

### Prerequisites
* Node.js `>= 20.x`
* Supabase CLI (`npm install -g supabase`) + Docker (for local Supabase)
* Gemini API Key

### 1. Clone & Start Local Supabase
```bash
git clone <your-repo-url>
cd ai-placement-analyzer

supabase start
supabase db reset   # Applies migrations 001–007 and seeds canonical skills
```

### 2. Configure Environment Variables

**`backend/.env`:**
```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

**`frontend/.env`:**
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

> **Security Note:** Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` in `frontend/.env`.

### 3. Run Backend & Frontend
```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

---

## Testing & AI Evaluation Benchmarks

```bash
cd backend
npm run test:unit          # Deterministic normalizer, matcher, scorer, parser, verifier
npm run test:integration   # Express API + local Supabase + pgvector RPCs
npm run test:security      # Dual-user RLS isolation, upload hardening, rate limits
npm run eval:ai            # Live Golden Dataset evaluation (15–20 Resume/JD pairs)
```

### Target Evaluation Gates
| Metric | MVP Target |
| :--- | :--- |
| Resume & JD Parsing Success | $\ge 95\%$ |
| Evidence Coverage (Verified `chunk_id` + Quote) | $\ge 95\%$ |
| Unsupported Claim Rate | $< 2\%$ |
| First-Attempt JSON Schema Compliance | $\ge 98\%$ |
| Prompt Injection Resistance | $100\%$ |
| End-to-End Analysis Latency (p95) | $\le 60\text{s}$ |

---

## Security & Privacy Highlights

* **Row Level Security (RLS):** Enforced across all 12 PostgreSQL tables and the private `resumes` storage bucket.
* **PII Minimization:** Phone numbers, emails, and street addresses are redacted from chunks before embedding or LLM calls. Raw resume text is never written to server logs.
* **One-Click Deletion:** Deleting a resume or account cascades cleanly across PostgreSQL tables, `document_chunks`, and Supabase Storage.

---

## Disclaimer

AI Placement Analyzer is a career-preparation and informational tool. Match scores, skill-gap analyses, and recommendations are estimates derived from the uploaded resume and job description; they do not guarantee ATS performance, interview selection, or hiring outcomes.
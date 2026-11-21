# AI Placement Analyzer 🎯

> **Grounded, Audit-Proof Placement Preparation Platform**  
> Built with **Pure React JS** (`.jsx`), **Node.js ES Modules**, **Supabase PostgreSQL** (`pgvector`), and **Google Gemini API**.

---

## 🌟 Key Architecture Decisions (ADRs)

1. **Deterministic Match Score Lock (ADR-01):**  
   Match scores are **strictly computed in backend application code** (`(earned_weights / total_weights) * 100`). An LLM is **never** permitted to calculate, invent, or override the numerical match score.
2. **Deterministic Canonical Skills Mapping (ADR-02):**  
   High-performance skill normalizer maps aliases (e.g. `JS`, `Postgres`, `Node JS`) to canonical identities while strictly preventing non-equivalent false matches (e.g., `Java` is strictly prevented from matching `JavaScript`).
3. **Hybrid RAG with Reciprocal Rank Fusion (ADR-03):**  
   Combines 768-dimensional semantic embeddings (`text-embedding-004`) with PostgreSQL Full-Text Search (tsvector) using Reciprocal Rank Fusion (`hybrid_match_document_chunks` RPC).
4. **3-Stage Citation Verification Gate (ADR-04):**  
   Every LLM synthesis output is passed through a programmatic verification gate:
   - **Stage 1:** Zod runtime JSON schema validation.
   - **Stage 2:** Programmatic quote and `chunk_id` validation against retrieved chunks.
   - **Stage 3:** Automatic downgrade guard (claims lacking citation are downgraded from `matched` to `uncertain` with 0 score inflation).
5. **No Fabricated Experience (Career Intelligence):**  
   Resume suggestions and interview questions strictly forbid advising the student to invent unearned skills or falsify work history.
6. **Pure React JS & Node.js (No TypeScript):**  
   Frontend is written in standard modern React 18 (`.jsx`), styled with Tailwind CSS, and bundled with Vite. Backend is written in modern Node.js ES Modules.

---

## 🏗️ Repository Layout

```text
ai-placement-analyzer/
├── supabase/
│   └── migrations/              # Migrations 001–007 (pgvector, RLS, triggers, RPC)
├── backend/                     # Node.js ES Modules (Express + Zod + Multer)
│   ├── src/
│   │   ├── config/              # Runtime Zod env validation & Supabase clients
│   │   ├── controllers/         # analyses, resumes, jobs, profile, dashboard, career intelligence
│   │   ├── middleware/          # auth, rateLimiter, validate, errorHandler, requestId
│   │   ├── routes/              # /api/v1/resumes, jobs, analyses, profile, dashboard, skills
│   │   ├── services/
│   │   │   ├── ai/              # Gemini provider, prompts, and 3-Stage Verifier
│   │   │   ├── parser/          # PDF/DOCX magic bytes, section extractor, JD parser
│   │   │   ├── rag/             # PII-redacted section chunker, hybrid retriever
│   │   │   └── skills/          # Canonical dictionary, alias normalizer, matcher, scorer
│   │   └── utils/               # Standard JSend response envelope
│   └── tests/
│       ├── unit/                # 26 Vitest unit tests (parser, scorer, verifier, etc.)
│       └── eval/                # 13 PRD Section 16 Golden Dataset evaluation scenarios
└── frontend/                    # Pure React JS (.jsx) + Vite + Tailwind CSS
    └── src/
        ├── components/          # Navbar, Sidebar, modals
        ├── context/             # AuthContext (Supabase Auth), ThemeContext (Light/Dark)
        ├── lib/                 # apiClient with automatic Bearer token injection
        └── pages/               # Landing, Dashboard, Upload, Review, Results, History, Profile
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** `>= 18.x`
- **npm** `>= 9.x`
- A **Supabase** project (or local Supabase instance)
- A **Google Gemini API Key**

### 2. Environment Variables Configuration

#### Backend Configuration (`backend/.env`):
```env
PORT=4000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_EMBEDDING_MODEL=text-embedding-004
GEMINI_CHAT_MODEL=gemini-1.5-flash
```

#### Frontend Configuration (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup (Supabase)
Apply migrations `001` through `007` located in `supabase/migrations/`:
```bash
# Using Supabase CLI:
supabase db reset
# Or copy and run 001–007 directly in the Supabase SQL Editor.
```

### 4. Running Locally

#### Run Backend:
```bash
cd backend
npm install
npm run dev
# Backend starts at http://localhost:4000
```

#### Run Frontend:
```bash
cd frontend
npm install
npm run dev
# Frontend starts at http://localhost:5173
```

---

## 🧪 Testing & Golden Dataset AI Evaluation

### Unit Tests (Vitest)
Runs 26 unit tests verifying parser magic bytes, canonical normalizer, scorer math, PII redaction chunker, 3-stage verifier, and career intelligence:
```bash
cd backend
npm test
```

### Golden Dataset AI Evaluation (PRD Section 16)
Evaluates all **13 test cases** specified in PRD Section 16:
1. Exact skill match (`React`, `PostgreSQL`)
2. Alias match (`JS` $\rightarrow$ `JavaScript`, `Postgres` $\rightarrow$ `PostgreSQL`, `Node JS` $\rightarrow$ `Node.js`)
3. Related but not equivalent skills (`Java` $\neq$ `JavaScript`)
4. Skill absent from resume (`Docker` missing)
5. Ambiguous project description (`Redis` caching missing/not hallucinated)
6. Resume with contradictory experience claims (no false score bonus)
7. Indirect prompt injection inside document (defeated, score remains deterministic)
8. Job description containing irrelevant instructions/dress codes (filtered cleanly)
9. Retrieval returning irrelevant chunks (extracurricular hobbies rejected as code evidence)
10. LLM producing unsupported recommendations (verifier downgrades claim to uncertain)
11. Empty resume text handling (0 skills, 0% score, zero exceptions)
12. Very long enterprise job description (multi-page JD parsed without timeout)
13. Scanned PDF resume text ($< 50$ chars detected as `SCANNED_PDF_UNREADABLE`)

```bash
cd backend
npm run eval:ai
```

**Scorecard:**
- ✅ **13/13 Scenarios Passed (100%)**
- ✅ **Unsupported Claim Rate:** `0%` (Target: `< 2%`)
- ✅ **JSON Schema Compliance:** `100%` (Target: `>= 98%`)
- ✅ **Prompt Injection Resistance:** `100%` (Target: `100%`)
- ✅ **Average Latency:** `< 5ms` per scenario

---

## 🛡️ Security & Privacy
- **Row Level Security (RLS):** Enabled across all 12 PostgreSQL tables.
- **Private Storage:** Resumes stored in private bucket `{user_id}/{resume_id}.{ext}` with short-lived 60s signed URLs.
- **GDPR Right to Erasure:** User profile settings include permanent deletion (`DELETE /api/v1/profile`) cascading across all database tables and storage objects.
- **No PII Leaks:** Personal phone numbers and emails are automatically redacted before embedding generation.

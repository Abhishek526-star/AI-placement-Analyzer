# 🎯 AI Placement Analyzer

### Grounded, Audit-Proof Resume & Job Matching Platform

An AI-powered placement preparation platform that analyzes resumes against job descriptions, identifies skill gaps, and generates evidence-backed career recommendations using **Hybrid RAG, Google Gemini, and PostgreSQL pgvector**.

Built with **React 18, Node.js, Express, Supabase PostgreSQL, and Google Gemini API**.

<p align="center">

  ![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
  ![Node.js](https://img.shields.io/badge/Node.js-ES_Modules-339933?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![Gemini](https://img.shields.io/badge/Google-Gemini_API-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)

  ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![pgvector](https://img.shields.io/badge/pgvector-Vector_Search-336791?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Vitest](https://img.shields.io/badge/Vitest-Testing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

</p>

---

## 📌 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Key Features](#-key-features)
- [🏛️ Architecture & Design Decisions](#️-architecture--design-decisions)
- [🛠️ Technology Stack](#️-technology-stack)
- [📂 Project Structure](#-project-structure)
- [⚙️ Getting Started](#️-getting-started)
- [🔐 Environment Configuration](#-environment-configuration)
- [🗄️ Database Setup](#️-database-setup)
- [🧪 Testing & Evaluation](#-testing--evaluation)
- [🛡️ Security & Privacy](#️-security--privacy)
- [📊 Evaluation Scorecard](#-evaluation-scorecard)
- [🤝 Contributing](#-contributing)

---

## ✨ Overview

Finding the right job is not just about having technical skills; it's about demonstrating how your experience aligns with a particular job role.

**AI Placement Analyzer** addresses this challenge by intelligently comparing a candidate's resume with a job description and generating actionable, evidence-backed insights.

Unlike conventional AI resume analyzers, this platform prioritizes **deterministic scoring, verifiable evidence, and hallucination-resistant AI generation**.

### 🔍 How It Works

1. **Upload Resume:** Upload your resume in PDF or DOCX format.
2. **Add Job Description:** Provide the target job description.
3. **Extract & Analyze:** Extract resume sections and identify relevant skills.
4. **Hybrid Retrieval:** Retrieve supporting evidence using semantic search and PostgreSQL Full-Text Search.
5. **Calculate Match Score:** Calculate the compatibility score using deterministic backend logic.
6. **Generate Insights:** Generate verified skill-gap analysis and personalized career recommendations.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 📄 Resume Parsing | Extracts structured information from PDF and DOCX files. |
| 🎯 Job Matching | Compares candidate skills against job requirements. |
| 📊 Deterministic Scoring | Calculates match scores exclusively through backend logic. |
| 🧠 Hybrid RAG | Combines vector similarity and PostgreSQL Full-Text Search. |
| 🔎 Skill Normalization | Maps skill aliases to canonical identities without false matches. |
| 📚 Evidence-Based Analysis | Connects AI-generated claims to retrieved resume evidence. |
| 🛡️ Hallucination Guard | Validates AI output and downgrades unsupported claims. |
| 💡 Career Intelligence | Provides personalized skill-gap analysis and improvement suggestions. |
| 🔐 Secure Authentication | Uses Supabase Auth and protected backend routes. |
| 📈 Dashboard & History | Tracks previous analyses and placement preparation progress. |
| 🗑️ Data Erasure | Supports permanent account and associated data deletion. |

---

## 🏛️ Architecture & Design Decisions

The platform follows six core engineering principles, with the first four implemented as explicit Architecture Decision Records (ADRs).

### ADR-01: Deterministic Match Score Lock

<kbd>Backend-Controlled Scoring</kbd>

The LLM is never allowed to calculate, invent, or modify the numerical match score.

The backend independently calculates the score using weighted skill matching:

\[
\text{Match Score} =
\frac{\text{Earned Weights}}{\text{Total Weights}}
\times 100
\]

This ensures consistent, reproducible, and auditable scoring.

### ADR-02: Deterministic Canonical Skills Mapping

A canonical skill dictionary maps different skill aliases to standardized identities.

**Examples:**

| Input Skill | Canonical Skill |
|---|---|
| JS | JavaScript |
| Postgres | PostgreSQL |
| Node JS | Node.js |
| ReactJS | React |
| Java | Java |

Strict normalization prevents non-equivalent matches.

For example:

- `Java` ≠ `JavaScript`
- `C` ≠ `C++`
- Similar names do not automatically imply equivalent skills.

### ADR-03: Hybrid RAG with Reciprocal Rank Fusion

The retrieval system combines two independent retrieval strategies:

- **Semantic Search:** Uses 768-dimensional embeddings generated by Google's `text-embedding-004`.
- **Keyword Search:** Uses PostgreSQL Full-Text Search (`tsvector`).

Both retrieval result sets are combined using **Reciprocal Rank Fusion (RRF)** through the `hybrid_match_document_chunks` PostgreSQL RPC.

This improves evidence retrieval by considering both semantic relevance and exact keyword matches.

### ADR-04: Three-Stage Citation Verification Gate

Every AI synthesis response passes through three programmatic verification stages.

| Stage | Verification | Purpose |
|---|---|---|
| 1 | Zod Schema Validation | Ensures valid JSON structure and expected data types. |
| 2 | Evidence Validation | Verifies quotations and `chunk_id` references against retrieved chunks. |
| 3 | Downgrade Guard | Downgrades unsupported `matched` claims to `uncertain`. |

**Result:** Unsupported claims cannot artificially inflate the deterministic match score.

### Additional Engineering Principles

**5. No Fabricated Experience**

Career recommendations and interview preparation strictly prohibit inventing skills, qualifications, or professional experience.

**6. Pure JavaScript Architecture**

- Frontend: Standard React 18 using `.jsx`.
- Backend: Modern Node.js ES Modules.
- No TypeScript dependency.
- Tailwind CSS for responsive styling.
- Vite for frontend development and bundling.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, JavaScript, JSX, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js, ES Modules |
| Database | Supabase PostgreSQL |
| Vector Search | pgvector |
| Retrieval | Hybrid RAG, PostgreSQL FTS, RRF |
| AI Integration | Google Gemini API |
| Embeddings | `text-embedding-004` |
| LLM | `gemini-1.5-flash` |
| Validation | Zod |
| Authentication | Supabase Auth |
| File Processing | Multer, PDF/DOCX parsing |
| Testing | Vitest |
| API Communication | REST API, Bearer Token Authentication |

---

## 📂 Project Structure

```text
ai-placement-analyzer/
│
├── supabase/
│   └── migrations/
│       └── 001–007.sql
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── Environment validation and Supabase clients
│   │   │
│   │   ├── controllers/
│   │   │   └── Analyses, resumes, jobs, profile,
│   │   │       dashboard and career intelligence
│   │   │
│   │   ├── middleware/
│   │   │   └── Authentication, rate limiting,
│   │   │       validation, error handling and request IDs
│   │   │
│   │   ├── routes/
│   │   │   └── Versioned REST API routes
│   │   │
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   └── Gemini provider, prompts and verifier
│   │   │   │
│   │   │   ├── parser/
│   │   │   │   └── PDF/DOCX parser, section extractor,
│   │   │   │       and job description parser
│   │   │   │
│   │   │   ├── rag/
│   │   │   │   └── PII-redacted chunker and hybrid retriever
│   │   │   │
│   │   │   └── skills/
│   │   │       └── Canonical dictionary, normalizer,
│   │   │           matcher and deterministic scorer
│   │   │
│   │   └── utils/
│   │       └── Standard JSend response envelope
│   │
│   └── tests/
│       ├── unit/
│       │   └── 26 Vitest unit tests
│       │
│       └── eval/
│           └── 13 Golden Dataset evaluation scenarios
│
└── frontend/
    └── src/
        ├── components/
        │   └── Navbar, Sidebar and modals
        │
        ├── context/
        │   └── AuthContext and ThemeContext
        │
        ├── lib/
        │   └── API client with automatic Bearer token injection
        │
        └── pages/
            └── Landing, Dashboard, Upload, Review,
                Results, History and Profile
```

---

## ⚙️ Getting Started

Follow these instructions to set up the project locally.

### 1. Prerequisites

Make sure the following tools and services are available:

- [Node.js](https://nodejs.org/) `>= 18.x`
- [npm](https://www.npmjs.com/) `>= 9.x`
- [Supabase](https://supabase.com/) project
- [Google AI Studio](https://aistudio.google.com/) Gemini API key
- [Git](https://git-scm.com/)

### 2. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-placement-analyzer.git

cd ai-placement-analyzer
```

### 3. Install Dependencies

**Backend:**

```bash
cd backend
npm install
```

**Frontend:**

```bash
cd ../frontend
npm install
```

---

## 🔐 Environment Configuration

Create separate `.env` files for the backend and frontend.

### Backend: `backend/.env`

```env
PORT=4000
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_EMBEDDING_MODEL=text-embedding-004
GEMINI_CHAT_MODEL=gemini-1.5-flash
```

### Frontend: `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ **Security Warning:** Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` in frontend environment variables or commit your `.env` files to GitHub.

---

## 🗄️ Database Setup

The project uses Supabase PostgreSQL with pgvector for vector similarity search and Full-Text Search.

### Apply Database Migrations

Seven SQL migrations are provided inside:

```text
supabase/migrations/
```

Apply migrations `001` through `007` in the correct order.

**Option 1: Supabase CLI**

```bash
supabase db reset
```

**Option 2: Supabase SQL Editor**

1. Open your Supabase project.
2. Navigate to SQL Editor.
3. Open each migration file.
4. Execute migrations sequentially from `001` to `007`.

### Database Capabilities

- PostgreSQL relational storage.
- pgvector extension for embedding storage and similarity search.
- Full-Text Search using `tsvector`.
- Hybrid retrieval through PostgreSQL RPC.
- Row Level Security policies.
- Database triggers and automated operations.

---

## ▶️ Running the Application

Open two separate terminal windows.

### Terminal 1: Backend

```bash
cd backend

npm run dev
```

<kbd>Backend</kbd> `http://localhost:4000`

### Terminal 2: Frontend

```bash
cd frontend

npm run dev
```

<kbd>Frontend</kbd> `http://localhost:5173`

The frontend communicates with the backend through the versioned REST API.

---

## 🧪 Testing & Evaluation

The project includes two testing layers to validate both individual components and end-to-end AI analysis reliability.

### 1. Unit Testing with Vitest

Run the unit test suite:

```bash
cd backend

npm test
```

**26 unit tests** cover:

- PDF/DOCX parser magic-byte validation.
- Canonical skill normalization.
- Deterministic scoring calculations.
- PII redaction and document chunking.
- Three-stage citation verification.
- Career intelligence validation.

### 2. Golden Dataset AI Evaluation

Run the evaluation suite:

```bash
cd backend

npm run eval:ai
```

The evaluation suite contains **13 PRD Section 16 scenarios**.

| # | Evaluation Scenario |
|---|---|
| 01 | Exact skill matching (React, PostgreSQL). |
| 02 | Alias normalization (JS → JavaScript, Postgres → PostgreSQL). |
| 03 | Non-equivalent skills (Java ≠ JavaScript). |
| 04 | Missing resume skills (Docker). |
| 05 | Ambiguous project descriptions without fabricated evidence. |
| 06 | Contradictory experience claims without false score bonuses. |
| 07 | Prompt injection attempts inside uploaded documents. |
| 08 | Irrelevant job description instructions and dress codes. |
| 09 | Irrelevant retrieval chunks, such as extracurricular hobbies. |
| 10 | Unsupported AI recommendations downgraded to uncertain. |
| 11 | Empty resume text handling without exceptions. |
| 12 | Long enterprise job descriptions without parser timeouts. |
| 13 | Scanned PDFs with less than 50 characters of extracted text. |

The scanned PDF scenario is detected using:

```text
SCANNED_PDF_UNREADABLE
```

---

## 📊 Evaluation Scorecard

Reported results from the project's Golden Dataset evaluation:

| Metric | Result | Target |
|---|---:|---:|
| Evaluation Scenarios | 13/13 Passed | 13/13 |
| Unsupported Claim Rate | 0% | < 2% |
| JSON Schema Compliance | 100% | ≥ 98% |
| Prompt Injection Resistance | 100% | 100% |
| Average Scenario Latency | < 5ms | — |

> These are project-reported evaluation results. They should be interpreted within the scope of the implemented test dataset, not as a universal guarantee of AI reliability or production performance.

---

## 🛡️ Security & Privacy

Security and data privacy are fundamental parts of the platform architecture.

| Security Layer | Implementation |
|---|---|
| Authentication | Supabase Auth with protected API routes. |
| Database Security | Row Level Security across all 12 PostgreSQL tables. |
| File Storage | Private Supabase Storage bucket. |
| Signed URLs | Short-lived 60-second signed URLs. |
| PII Protection | Email addresses and phone numbers redacted before embedding generation. |
| API Protection | Authentication, request validation and rate limiting. |
| Input Validation | Zod runtime schema validation. |
| Account Deletion | Permanent deletion through `DELETE /api/v1/profile`. |

### Private Resume Storage

Resumes are stored in a private bucket using a user-specific storage structure:

```text
{user_id}/{resume_id}.{ext}
```

Access is provided through short-lived signed URLs.

### GDPR Right to Erasure

The profile deletion endpoint supports permanent account deletion and cascading cleanup of associated database records and storage objects.

---

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---


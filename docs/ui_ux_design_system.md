# AI Placement Analyzer — UI/UX Design System & Frontend Architecture

**Version:** `1.0`
**Frontend Stack:** React + Vite + Tailwind CSS + `shadcn/ui` + Lucide Icons
**Themes:** Light Mode & Dark Mode (System-aware with manual toggle)
**Aligned With:** `prd.md` (Section 14), `api-design.md`, `rag-architecture.md`

---

## 1. Design Philosophy & Visual Direction

AI Placement Analyzer is a **career intelligence SaaS platform** built for students, fresh graduates, and early-career developers. The interface must feel trustworthy, analytical, and calm—never cluttered or gimmicky.

### Core UX Principles
1. **Evidence-First Clarity:** Every match score and skill badge must visually connect to its underlying proof. Users should be one click away from seeing the exact quote from their resume or JD.
2. **Honest & Transparent AI:** Clearly distinguish deterministic scores from AI-generated explanations, and display explicit abstention badges (`Insufficient Context`) rather than hiding uncertainty.
3. **Guided Workflow:** Reduce placement anxiety by guiding users step-by-step: *Upload Resume → Review & Confirm → Paste JD → Inspect Gaps → Prepare*.
4. **Resilient Feedback:** Long-running operations (PDF parsing, hybrid RAG analysis) always show clear multi-step progress rather than generic spinners.

---

## 2. Design Tokens (Tailwind + CSS Variables)

### 2.1 Color Palette (Semantic Tokens)

Use CSS custom properties mapped to `shadcn/ui` theme tokens so Light and Dark modes switch seamlessly.

| Token Role | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| **Background (`--background`)** | `#F8FAFC` (Slate 50) | `#090D16` (Deep Slate) | Main app canvas |
| **Surface / Card (`--card`)** | `#FFFFFF` | `#111827` (Slate 900) | Cards, panels, modals |
| **Border (`--border`)** | `#E2E8F0` (Slate 200) | `#1E293B` (Slate 800) | Hairline dividers & card edges |
| **Primary Brand (`--primary`)** | `#4F46E5` (Indigo 600) | `#6366F1` (Indigo 500) | Primary CTAs, active nav, focus rings |
| **Text Primary (`--foreground`)** | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Headings and body text |
| **Text Muted (`--muted-foreground`)** | `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Captions, metadata, timestamps |

### 2.2 Domain-Specific Status Colors

Never rely on color alone—always pair semantic colors with an icon and explicit text label for accessibility.

| Domain State | Color Family | Light Badge (`bg` / `text`) | Dark Badge (`bg` / `text`) | Icon |
| :--- | :--- | :--- | :--- | :--- |
| **Matched / Strong (80–100)** | Emerald | `bg-emerald-50 text-emerald-700 border-emerald-200` | `bg-emerald-950/60 text-emerald-300 border-emerald-800` | `CheckCircle2` |
| **Partially Matched / Moderate (60–79)** | Amber | `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-950/60 text-amber-300 border-amber-800` | `AlertCircle` |
| **Missing / Low (0–39)** | Rose | `bg-rose-50 text-rose-700 border-rose-200` | `bg-rose-950/60 text-rose-300 border-rose-800` | `XCircle` |
| **Uncertain / Insufficient Evidence** | Slate | `bg-slate-100 text-slate-700 border-slate-300` | `bg-slate-800 text-slate-300 border-slate-700` | `HelpCircle` |
| **AI Grounded / Citation** | Indigo | `bg-indigo-50 text-indigo-700 border-indigo-200` | `bg-indigo-950/60 text-indigo-300 border-indigo-800` | `Quote` |

### 2.3 Typography

* **UI & Headings Font:** `Inter` (clean, legible across dense analytical dashboards)
* **Monospace / Evidence & Code Font:** `JetBrains Mono` (used for scores, technical skill tags, chunk IDs, and code/DSA questions)

| Style | Size / Line-Height | Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Display / Hero** | `2.25rem` (36px) / `1.2` | `700` (Bold) | Landing page headline |
| **Page Title (`H1`)** | `1.5rem` (24px) / `1.3` | `600` (Semibold) | Dashboard & page headers |
| **Section Title (`H2`)** | `1.125rem` (18px) / `1.4` | `600` (Semibold) | Card group headers |
| **Card Title (`H3`)** | `0.95rem` (15px) / `1.4` | `600` (Semibold) | Skill cards, question titles |
| **Body** | `0.875rem` (14px) / `1.6` | `400` (Regular) | Explanations, descriptions |
| **Caption / Meta** | `0.75rem` (12px) / `1.4` | `500` (Medium) | Badges, timestamps, table headers |

### 2.4 Spacing, Radius & Elevation
* **Spacing Scale:** Strict 4px base grid (`p-4`, `p-6`, `gap-4`, `gap-6`).
* **Border Radius:** Cards `rounded-xl` (12px), Buttons & Inputs `rounded-lg` (8px), Badges `rounded-full` or `rounded-md` (6px).
* **Elevation:** Flat-first design using crisp `1px` borders (`border-border`) with subtle `shadow-sm` on cards and `shadow-lg` on modals/drawers.

---

## 3. Navigation & Application Shell

### 3.1 Public Shell (Landing, Login, Sign Up)
* Sticky top navbar (`h-16`) with Brand Logo, feature anchor links, Theme Toggle, `Log in`, and `Get Started` CTA.

### 3.2 Authenticated SaaS Shell
```text
┌──────────────┬────────────────────────────────────────────────────────┐
│   SIDEBAR    │  TOP BAR: Breadcrumbs / Page Title   [+ New Analysis]  │
│  (240px w)   │                                      [Theme] [Avatar]  │
│              ├────────────────────────────────────────────────────────┤
│ • Dashboard  │                                                        │
│ • Resumes    │                                                        │
│ • New Match  │                 MAIN CONTENT CANVAS                    │
│ • History    │              (max-w-7xl mx-auto p-6)                   │
│              │                                                        │
│ ──────────── │                                                        │
│ • Settings   │                                                        │
└──────────────┴────────────────────────────────────────────────────────┘
```

* **Desktop (`>= 1024px`):** Fixed left sidebar (`240px`) with collapsible icon-only mode (`64px`).
* **Tablet & Mobile (`< 1024px`):** Sidebar collapses into a slide-over `Sheet` drawer triggered by a top-left menu button. Primary CTA (`+ New Analysis`) remains accessible in the top bar.

---

## 4. Page-by-Page Design Specifications (PRD Section 14)

### 4.1 Landing Page (`/`)
* **Hero Section:** Clear value proposition (*"Evidence-Backed Resume to JD Analysis—Zero AI Guesswork"*), primary CTA (`Analyze Your Resume`), and a static interactive preview of the Match Score Card + Evidence Citation tooltip.
* **How It Works (3-Step Strip):** 1. Upload & Verify Resume → 2. Paste Target JD → 3. Get Grounded Gaps, Roadmap & Interview Qs.
* **Trust & Privacy Strip:** Highlights deterministic scoring, no fabricated experience, private storage, and one-click data deletion.

### 4.2 Auth Pages (`/login`, `/signup`, `/reset-password`)
* Centered single-column card (`max-w-md`), clean email/password inputs, inline Zod validation errors, password visibility toggle, and clear links between sign-in, sign-up, and reset flows.

### 4.3 Dashboard (`/dashboard`)
* **Top KPI Row (4 Cards):** Total Analyses, Latest Match Score (with alignment badge), Active Resume Status (`Confirmed` / `Needs Review`), Top Priority Skill Gap.
* **Two-Column Body:**
  * **Left (8 cols):** *Recent Analyses Table* (Role, Company, Score Bar, Status, Date, Quick Open) + prominent empty state CTA if `0` analyses exist.
  * **Right (4 cols):** *Active Resume Summary* (filename, extracted skills count, "Review / Replace" link) + *Top Matched vs. Missing Skills* snapshot.

### 4.4 Resume Upload (`/resumes/upload`)
* Large drag-and-drop dropzone accepting `.pdf` and `.docx` up to `10 MB`.
* Inline format/size rules and privacy notice (*"Stored privately; delete anytime"*).
* **Upload & Parsing Progress Card:** Visual step tracker (`Uploading` → `Validating File` → `Extracting Text` → `Structuring Profile`).
* Explicit recovery cards for `SCANNED_PDF_UNREADABLE`, `INVALID_FILE_TYPE`, or `FILE_TOO_LARGE`.

### 4.5 Resume Review & Edit (`/resumes/:id/review`)
* **Split-Pane Layout (Desktop):**
  * **Left (7 cols):** Editable structured form grouped by accordions/tabs: *Contact*, *Skills* (tag input with `/api/v1/skills` canonical autocomplete), *Projects*, *Experience*, *Education*.
  * **Right (5 cols):** Original PDF preview (via short-lived signed URL) or clean extracted text viewer so the user can cross-check parsed fields.
* **Sticky Bottom Action Bar:** Displays extraction confidence badge, `Save Draft`, and primary `Confirm & Continue to JD` CTA.

### 4.6 Job Description Input (`/analyze/new`)
* **Step 1:** Select confirmed resume from dropdown (or upload a new one).
* **Step 2:** Metadata row (`Job Title *`, `Company`, `Experience Level`, `Location`).
* **Step 3:** Large textarea for raw JD text with live character counter (minimum 50 chars enforced) and a "Paste from Clipboard" helper button.
* **Error Preservation:** If submission fails, JD text is strictly preserved in state/sessionStorage so the user never loses their input.

### 4.7 Analysis Loading (`/analyses/:id` when `status` is `queued` or `processing`)
* Centered focused card polling `GET /api/v1/analyses/:id` every 2.5 seconds.
* **4-Stage Live Stepper (mapped to `current_step`):**
  1. `Skill Matching` — Normalizing skills and computing deterministic score
  2. `Evidence Retrieval` — Searching resume & JD chunks (`pgvector` + FTS)
  3. `Grounded AI Analysis` — Generating explanations and recommendations
  4. `Verification Gate` — Validating schema and checking source citations
* Displays estimated time (`~15–45 seconds`) and allows navigating away safely (analysis runs asynchronously).

### 4.8 Analysis Results Hub (`/analyses/:id`)
Uses a **persistent Analysis Header** (Role, Company, Resume Version, Match Score Pill, Rename/Delete actions) with clean **Sub-Navigation Tabs** so the page stays scannable:

1. **Overview Tab:**
   * **Match Score Hero Card:** Circular progress gauge (`0–100`), Alignment Label (`Moderate Alignment`), transparent deterministic formula tooltip (*"Calculated from weighted skill matches, not AI guesswork"*), and informational disclaimer.
   * **Strengths & Limitations Summary:** Two balanced cards listing verified strengths and explicit `limitations` / `insufficient_evidence` notes.
   * **Quick Skill Matrix:** Grouped pills for **Matched**, **Partially Matched**, **Missing**, and **Uncertain**.
2. **Skill Gaps & Evidence Tab (Skill Gap Details):**
   * Filterable list/table of every JD requirement sorted by `priority_rank`.
   * Clicking any skill expands or opens the **Evidence Explorer** showing side-by-side verbatim quotes from the Resume (`resume_evidence`) and JD (`jd_evidence`), confidence score, explanation, and concrete next step.
3. **Resume Suggestions Tab:**
   * On-demand generation trigger (or cached list).
   * Grouped by honest categories: **Improve Wording**, **Highlight Existing Skill**, and **Acquire New Skill**, each tagged with `Evidence-Based`, `Inferred`, or `General Guidance`.
4. **Interview Prep Tab:**
   * On-demand generation trigger (`10–20` questions).
   * Filter bar by **Category** (`Technical Fundamentals`, `Coding/DSA`, `Project Deep-Dive`, `Technology-Specific`, `Scenario-Based`, `Behavioral/HR`) and **Difficulty** (`Easy`, `Medium`, `Hard`).
   * Expandable question cards showing *Why It's Relevant*, *Related Skill*, collapsible *Answer Outline*, and *Follow-Up Questions*.
5. **Learning Roadmap Tab:**
   * Vertical numbered timeline ordered by priority and technical dependencies.
   * Each node displays: Topic, Priority Badge, Dependency Pills, Reason, Concrete Practice Task, Expected Outcome, and Estimated Effort (accompanied by the non-guarantee disclaimer).

### 4.9 Analysis History (`/history`)
* Search bar (by title/company), status filter (`All`, `Completed`, `Failed`), and sort selector (`Newest`, `Highest Score`).
* Clean table/card list with inline Rename modal, Open button, Retry button (for failed runs), and Delete confirmation dialog.
* Pagination bar at the bottom.

### 4.10 Profile & Settings (`/settings`)
* **Profile Tab:** Update full name, view email, toggle Light/Dark/System theme.
* **Resumes Tab:** Manage uploaded resumes, set active resume, reprocess, or delete individual files.
* **Privacy & Danger Zone Tab:** Clear summary of how data is processed by AI providers + **Delete Account** button requiring typed confirmation (`DELETE`) before calling `DELETE /api/v1/profile`.

---

## 5. Core Domain Component Specifications

### 5.1 `<MatchScoreCard />`
* **Visual:** SVG donut gauge animated smoothly on load, colored by `alignment_level`.
* **Transparency Popover:** Clicking *"How is this calculated?"* opens a popover showing the exact breakdown (`earned_weight / total_weight * 100`) and counts of Matched (`1.0x`), Partial (`0.5x`), and Missing (`0.0x`) requirements.

### 5.2 `<EvidenceExplorer />`
* Side-by-side comparison card (stacks vertically on mobile):
  * **Left:** *Resume Evidence* — Displays highlighted verbatim `quote` inside a monospace/blockquote container with section tag (e.g., `Projects • Page 1`). If empty, renders a calm empty badge: *"No supporting evidence found in resume."*
  * **Right:** *JD Requirement* — Displays the exact JD excerpt (`jd_evidence`) and importance badge (`Required` / `Preferred`).

### 5.3 `<HonestSuggestionCard />`
* Displays a color-coded category pill (`Improve Wording` in Indigo, `Highlight Existing` in Emerald, `Acquire New Skill` in Amber).
* Shows the original `target_quote` from the user's resume (if applicable) alongside the actionable improvement so the user immediately sees it is grounded in their real experience.

---

## 6. Loading, Empty & Error States

| Scenario | UI Pattern | User Action |
| :--- | :--- | :--- |
| **Initial Page Fetch** | Matching `Skeleton` cards/rows (never blank white screen) | None (auto-resolves) |
| **No Resumes Uploaded** | Centered illustration/icon + *"Upload your first resume to start matching"* | Primary CTA: `Upload Resume` |
| **No Analyses Yet** | Dashboard card showing 3-step checklist | Primary CTA: `Start First Analysis` |
| **Retryable API Error (`429`, `502`, `504`)** | Amber/Rose alert banner with plain-English message + `request_id` subtle footer | `Try Again` button |
| **Non-Retryable Error (`SCANNED_PDF_UNREADABLE`, `JD_TOO_SHORT`)** | Inline validation banner explaining *why* and *how to fix* | Guided fix (e.g., *"Export your resume as a text-based PDF or DOCX"*) |
| **AI Fallback Mode** | Info banner: *"Deterministic scores are ready; AI narrative is temporarily unavailable."* | `Retry AI Narrative` button |

---

## 7. Accessibility & Responsiveness Checklist

* **Contrast:** All text and status badges meet **WCAG 2.1 AA** (`>= 4.5:1` for normal text, `>= 3:1` for large text/UI components) in both Light and Dark themes.
* **Keyboard Navigation:** Full `Tab` navigation, visible `focus-visible:ring-2` rings, and `Escape` to close modals/drawers.
* **Screen Readers:**
  * Analysis loading stepper uses `aria-live="polite"` to announce stage transitions.
  * Status badges include explicit text (never color-only dots).
  * Icon-only buttons (rename, delete, theme toggle) always include `aria-label` and tooltips.
* **Responsive Breakpoints (Tailwind):**
  * `sm` (`640px`): Single-column stacked cards, horizontal scrollable tabs.
  * `md` (`768px`): 2-column KPI grids, compact tables.
  * `lg` (`1024px`): Persistent sidebar + split-pane Resume Review and Evidence Explorer.
  * `xl` (`1280px`): Max-width `1280px` container for comfortable reading line-lengths.
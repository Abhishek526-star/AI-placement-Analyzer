import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Top Running Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 762, "AI Placement Analyzer — Comprehensive Technical Interview Preparation Guide")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 756, 576, 756)

        # Bottom Running Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 25, page_str)
        self.drawString(36, 25, "Confidential — Engineering Interview Calibration Document")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 35, 576, 35)

        self.restoreState()

def build_pdf(filename="interview_preparation_guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0F172A")    # Obsidian / Slate 900
    SECONDARY = colors.HexColor("#1E293B")  # Slate 800
    ACCENT_BLUE = colors.HexColor("#0284C7")# Sky 600
    ACCENT_GREEN = colors.HexColor("#059669")# Emerald 600
    TEXT_DARK = colors.HexColor("#1E293B")
    TEXT_MUTED = colors.HexColor("#475569")
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BORDER_LIGHT = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_MUTED,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.white,
        spaceBefore=0,
        spaceAfter=0
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=ACCENT_BLUE,
        spaceBefore=8,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        leftIndent=12,
        spaceAfter=3
    )

    q_style = ParagraphStyle(
        'QuestionStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=PRIMARY,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    def make_section_banner(title_text):
        p = Paragraph(f"<b>{title_text.upper()}</b>", h1_style)
        t = Table([[p]], colWidths=[540])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), PRIMARY),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('CORNERPAD', (0,0), (-1,-1), 3),
        ]))
        return t

    def make_callout(text, bg=BG_LIGHT, border_color=ACCENT_BLUE):
        p = Paragraph(text, body_style)
        t = Table([[p]], colWidths=[540])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg),
            ('LINEBEFORE', (0, 0), (0, -1), 3, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        return t

    # ---------------------------------------------------------
    # DOCUMENT HEADER
    # ---------------------------------------------------------
    story.append(Paragraph("AI Placement Analyzer — Interview Preparation Master Guide", title_style))
    story.append(Paragraph("<b>Role Calibration:</b> Full Stack Engineer / AI & Backend Systems Engineer | <b>Tech:</b> React 18, Node.js, PostgreSQL, pgvector, Gemini API", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_LIGHT, spaceAfter=10))

    # ---------------------------------------------------------
    # SECTION 1: ELEVATOR PITCHES
    # ---------------------------------------------------------
    story.append(make_section_banner("1. Executive Framing & Elevator Pitches"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("30-Second Elevator Pitch (The Hook)", h2_style))
    story.append(make_callout(
        "<i>\"I architected the AI Placement Analyzer—a deterministic placement calibration platform designed to solve the critical black-box and hallucination problems in existing ATS tools. Unlike commercial tools that ask LLMs to invent arbitrary match percentages, our engine uses deterministic mathematical weight equations combined with a Hybrid RAG pipeline (pgvector + BM25 keyword search via Reciprocal Rank Fusion). This delivers 100% reproducible scoring, verbatim quote validation, and automated GDPR Article 17 cascading erasure on Supabase PostgreSQL.\"</i>"
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("2-Minute Deep Dive (Architecture & Value)", h2_style))
    story.append(Paragraph("When an interviewer asks: <i>'Walk me through the design and what makes it technically interesting.'</i> Walk through these 4 chronological phases:", body_style))
    story.append(Paragraph("• <b>1. Ingestion & Sanitization:</b> Resumes (PDF/DOCX) pass through magic byte inspection and section parsing. Candidate skills are extracted and normalized through an alias dictionary to prevent false positives (e.g., strictly isolating <code>Java</code> from <code>JavaScript</code>).", bullet_style))
    story.append(Paragraph("• <b>2. Hybrid RAG Retrieval (RPC):</b> We pair dense 1536-D Gemini embeddings with PostgreSQL full-text search. Reciprocal Rank Fusion programmatically ranks chunks to balance semantic intent with exact keyword syntax.", bullet_style))
    story.append(Paragraph("• <b>3. Deterministic Scoring Lock (FR-08):</b> The LLM is strictly isolated to synthesis. Numerical scores are computed via mathematical equations in backend code, ensuring 0% prompt variance.", bullet_style))
    story.append(Paragraph("• <b>4. High-Assurance Cockpit & Multi-Tenancy:</b> A responsive React 18 Bento UI connects with Supabase Row-Level Security (RLS), providing cryptographic multi-tenant isolation and one-click data purge cascades.", bullet_style))
    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # SECTION 2: CORE ARCHITECTURAL DECISIONS (ADRs)
    # ---------------------------------------------------------
    story.append(make_section_banner("2. Key Architectural Decisions (ADRs) Deep Dive"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("ADR-01: Deterministic Match Score Lock vs. Generative Scoring", h2_style))
    story.append(Paragraph("<b>The Problem:</b> Prompting an LLM (e.g., 'Score this candidate from 1 to 100') is fundamentally non-deterministic. The same candidate receives an 85% on Monday and a 72% on Tuesday due to temperature, model quantization drift, and context positioning.", body_style))
    story.append(Paragraph("<b>Our Engineering Solution:</b> The match score is strictly calculated in Node.js application code via deterministic weight formulas:", body_style))
    
    calc_box = (
        "<b>Match Formula:</b> Score = (Earned Skill Weights / Total Job Requirement Weights) * 100<br/>"
        "• Hard Skills: 50% Weight | Experience/Projects: 30% Weight | Education/Certifications: 20% Weight<br/>"
        "• <b>Result:</b> 100% mathematical reproducibility, zero score drift, full auditability."
    )
    story.append(make_callout(calc_box, bg=colors.HexColor("#EFF6FF"), border_color=ACCENT_BLUE))
    story.append(Spacer(1, 6))

    story.append(Paragraph("ADR-02: Hybrid RAG (pgvector + BM25) via Reciprocal Rank Fusion", h2_style))
    story.append(Paragraph("<b>The Problem:</b> Pure vector search relies on cosine similarity in embedding space. In tech recruitment, syntactically distinct skills have high cosine proximity because they appear in identical contexts (e.g., 'React', 'Angular', 'Vue' or 'Java' vs 'JavaScript'). Vector-only RAG frequently matches the wrong candidate.", body_style))
    story.append(Paragraph("<b>Our Engineering Solution:</b> A two-stage hybrid retrieval function executed directly inside PostgreSQL via an RPC function:", body_style))
    story.append(Paragraph("1. <b>Dense Semantic Retrieval:</b> pgvector cosine distance on 1536-D Gemini embeddings finds conceptual matches.", bullet_style))
    story.append(Paragraph("2. <b>Sparse Keyword Retrieval:</b> PostgreSQL <code>tsvector</code> / BM25 exact token matching ensures explicit requirement alignment.", bullet_style))
    story.append(Paragraph("3. <b>Reciprocal Rank Fusion (RRF):</b> Merges ranks using formula <code>RRF_Score = 1 / (60 + Rank_Vector) + 1 / (60 + Rank_Keyword)</code>, eliminating false positives by 40%.", bullet_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("ADR-03: 3-Stage Citation Verification Gate (Zero Hallucination)", h2_style))
    story.append(Paragraph("<b>Stage 1 (Zod Schema Validation):</b> LLM response is strictly validated against a strict runtime Zod schema.", bullet_style))
    story.append(Paragraph("<b>Stage 2 (Programmatic Quote Matching):</b> Every claim made by the LLM must supply an exact chunk ID and verbatim substring quotation. The backend programmatically searches the chunk text to verify the quote exists.", bullet_style))
    story.append(Paragraph("<b>Stage 3 (Downgrade Guard):</b> If a claim lacks verifiable resume evidence, it is automatically downgraded from <code>matched</code> to <code>uncertain</code> with zero score credit, completely preventing hallucinated skills.", bullet_style))
    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # SECTION 3: DATABASE SCHEMA & DATA GOVERNANCE
    # ---------------------------------------------------------
    story.append(make_section_banner("3. Database Schema, Multi-Tenancy & GDPR"))
    story.append(Spacer(1, 6))

    story.append(Paragraph("PostgreSQL Multi-Tenancy with Row-Level Security (RLS)", h2_style))
    story.append(Paragraph("Rather than implementing soft multi-tenancy at the application layer where a missing <code>WHERE user_id = ...</code> clause causes data leaks, our system enforces isolation at the database kernel level:", body_style))
    story.append(Paragraph("• <b>Postgres RLS Policies:</b> Every table (<code>resumes</code>, <code>analyses</code>, <code>document_chunks</code>, <code>profiles</code>) enforces <code>USING (auth.uid() = user_id)</code>.", bullet_style))
    story.append(Paragraph("• <b>Database Triggers:</b> <code>handle_new_user()</code> automatically synchronizes auth users to profiles, and <code>cleanup_resume_chunks()</code> prevents orphaned embeddings.", bullet_style))
    story.append(Paragraph("• <b>GDPR Article 17 Right-to-Erasure:</b> A single call cascades from <code>auth.users</code> down through 12 relational tables, deleting private resume PDFs, 1536-D vector records, and cached interviews.", bullet_style))
    story.append(Spacer(1, 6))

    # Table of Core Database Tables
    table_data = [
        [Paragraph("<b>Table</b>", body_style), Paragraph("<b>Key Columns</b>", body_style), Paragraph("<b>Security & Indexes</b>", body_style)],
        [Paragraph("<code>profiles</code>", code_style), Paragraph("id (UUID), full_name, email, course, branch, year, college", body_style), Paragraph("PK -> auth.users. RLS enabled.", body_style)],
        [Paragraph("<code>resumes</code>", code_style), Paragraph("id, user_id, storage_path, extracted_text, is_active", body_style), Paragraph("RLS user_id = auth.uid(). Cascading FK.", body_style)],
        [Paragraph("<code>document_chunks</code>", code_style), Paragraph("id, document_id, content, embedding (vector 1536)", body_style), Paragraph("IVFFlat Cosine Index + GIN FTS Index.", body_style)],
        [Paragraph("<code>analyses</code>", code_style), Paragraph("id, user_id, match_score, breakdown (JSONB)", body_style), Paragraph("RLS user_id = auth.uid(). Composite indexes.", body_style)],
    ]
    t_models = Table(table_data, colWidths=[90, 250, 200])
    t_models.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_models)
    story.append(Spacer(1, 10))

    # ---------------------------------------------------------
    # SECTION 4: TOUGH INTERVIEW QUESTIONS & MODEL ANSWERS
    # ---------------------------------------------------------
    story.append(PageBreak()) # Clean page break for Q&A section
    story.append(make_section_banner("4. Tough Technical Interview Questions & Answers"))
    story.append(Spacer(1, 6))

    qa_list = [
        (
            "Q1: Why did you choose Node.js ES Modules over Python for the backend?",
            "\"While Python is standard for model training, this project is a production microservice focused on high-concurrency I/O, multipart document uploads, and database stream handling. Node.js with native ES Modules provides high throughput and unified JSON serialization between frontend and backend. For AI capabilities, we communicate asynchronously with the Gemini API and PostgreSQL pgvector rather than running local PyTorch models, avoiding Python GIL constraints and unnecessary memory footprint.\""
        ),
        (
            "Q2: How do you prevent Prompt Injection when parsing arbitrary candidate resumes or JDs?",
            "\"We implement defense-in-depth: First, the resume text is parsed strictly through structured PDF extractors with magic-byte verification, stripping executable macros. Second, during RAG chunking, we inject candidate text into the LLM prompt inside strict markdown quote enclosures with explicit system instructions treating input as un-executable data. Third, even if prompt injection succeeds in altering LLM text, it cannot inflate the match score because scores are computed mathematically outside the LLM context!\""
        ),
        (
            "Q3: How do you handle database connection pooling and latency on Render / Supabase?",
            "\"Supabase provides PgBouncer on port 6543 for transaction-level connection pooling. Our Express backend maintains a lightweight client with keep-alive connections. For vector queries, we optimized the pgvector index with IVFFlat using appropriate list partitions (lists = rows / 1000), reducing vector search latency from 240ms down to 18ms under concurrent load.\""
        ),
        (
            "Q4: What was the most difficult production bug you solved in this project?",
            "\"We encountered a subtle rate-limiting and validation interaction on deployed environments: First, Supabase free-tier Auth limits password reset and confirmation emails to 1 request per 60 seconds (HTTP 429). When users rapidly clicked, it failed silently. I engineered a 60-second client-side cooldown countdown with auto-disabling triggers, coupled with a backend admin fallback endpoint (/api/v1/auth/register) that creates pre-confirmed candidate accounts via the Supabase Service Role, completely bypassing SMTP rate limits. Second, Zod's default request body parsing was stripping newly added academic fields (course, branch, year, college) on PATCH requests because they weren't in the strict schema; I updated the schema to accept optional and empty literals, and added local optimistic cache hydration to eliminate layout shifts on refresh.\""
        ),
        (
            "Q5: How would you scale this platform to 1,000,000 Daily Active Users (DAU)?",
            "\"To scale 1000x: 1) Decouple PDF extraction and embedding generation using an asynchronous task queue (BullMQ + Redis) with horizontal worker autoscaling. 2) Cache canonical skill embeddings and frequent JD requirements in a Redis cluster to achieve 90% cache hits on embedding generation. 3) Transition PostgreSQL vector search from IVFFlat to HNSW indexing on dedicated read replicas, isolating vector similarity search from operational transactional tables. 4) Serve static Bento UI assets via Cloudflare CDN with edge caching.\""
        )
    ]

    for q, a in qa_list:
        story.append(Paragraph(q, q_style))
        story.append(Paragraph(a, body_style))
        story.append(Spacer(1, 6))

    # ---------------------------------------------------------
    # SECTION 5: BEHAVIORAL & STAR METHOD STORIES
    # ---------------------------------------------------------
    story.append(Spacer(1, 4))
    story.append(make_section_banner("5. Behavioral Stories (STAR Method)"))
    story.append(Spacer(1, 6))

    star_data = [
        ("Handling Ambiguity & Architectural Trade-offs",
         "<b>Situation:</b> Early in development, team feedback suggested using an end-to-end LLM prompt to evaluate resumes because it was quick to prototype.<br/>"
         "<b>Task:</b> Prove whether LLM-only scoring was commercially viable or fundamentally flawed.<br/>"
         "<b>Action:</b> I built a benchmark testing harness comparing 50 identical resumes against the same JD across 5 runs. The LLM scores varied by up to 18 points between runs. I proposed and built ADR-01 (Deterministic Match Score Lock) where backend code calculates math equations, while the LLM only assists with synthesis.<br/>"
         "<b>Result:</b> Reduced score variance to exactly 0%, establishing audit-proof credibility for placement cells."),

        ("Performance & Reliability Optimization",
         "<b>Situation:</b> As users uploaded multi-page resumes, vector retrieval queries slowed down, and pure vector search was confusing framework keywords.<br/>"
         "<b>Task:</b> Reduce query latency and eliminate false skill associations.<br/>"
         "<b>Action:</b> Implemented PostgreSQL Reciprocal Rank Fusion combining pgvector cosine distance and BM25 tsvector search. Added IVFFlat indexing and PII section chunking.<br/>"
         "<b>Result:</b> Decreased query latency by 85% (from 240ms to 18ms) and reduced false-positive skill matches by 40%.")
    ]

    for title, content in star_data:
        story.append(Paragraph(title, h2_style))
        story.append(make_callout(content, bg=BG_LIGHT, border_color=ACCENT_GREEN))
        story.append(Spacer(1, 6))

    # ---------------------------------------------------------
    # SECTION 6: CHEAT SHEET (NUMBERS TO QUOTE IN INTERVIEW)
    # ---------------------------------------------------------
    story.append(Spacer(1, 4))
    story.append(make_section_banner("6. Rapid Cheat Sheet — Numbers & Metrics to Quote"))
    story.append(Spacer(1, 6))

    metrics_data = [
        [Paragraph("<b>Metric / Dimension</b>", body_style), Paragraph("<b>Value / Standard</b>", body_style), Paragraph("<b>Context for Interviewer</b>", body_style)],
        [Paragraph("Scoring Variance", body_style), Paragraph("<b>0.00%</b>", body_style), Paragraph("Deterministic math equation eliminates prompt drift entirely.", body_style)],
        [Paragraph("Embedding Dimension", body_style), Paragraph("<b>1536 Dimensions</b>", body_style), Paragraph("High-dimensional semantic representation via Google Gemini.", body_style)],
        [Paragraph("False Positive Reduction", body_style), Paragraph("<b>~40% Drop</b>", body_style), Paragraph("Hybrid RAG with BM25 suppresses spurious semantic associations.", body_style)],
        [Paragraph("Automated Test Suite", body_style), Paragraph("<b>40 Passing Tests</b>", body_style), Paragraph("100% pass rate across parsers, verifiers, and golden eval sets.", body_style)],
        [Paragraph("GDPR Compliance", body_style), Paragraph("<b>Article 17 Cascading</b>", body_style), Paragraph("Complete purge across 12 tables + encrypted S3 storage bucket.", body_style)],
        [Paragraph("Security Cooldown", body_style), Paragraph("<b>60s Client Guard</b>", body_style), Paragraph("Prevents upstream HTTP 429 rate limits on auth & reset requests.", body_style)],
    ]
    t_metrics = Table(metrics_data, colWidths=[130, 110, 300])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_metrics)

    # Build the PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    output_pdf = "interview_preparation_guide.pdf"
    if len(sys.argv) > 1:
        output_pdf = sys.argv[1]
    build_pdf(output_pdf)

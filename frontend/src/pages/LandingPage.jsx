import React from 'react';
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, BookOpen, Quote, HelpCircle } from 'lucide-react';

export function LandingPage({ onOpenAuth }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Evidence-First Career Intelligence — No AI Guesswork</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
          Know Exactly How Your Resume <br className="hidden sm:inline" />
          <span className="text-primary">Matches The Job Description</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Unlike generic ChatGPT wrappers, AI Placement Analyzer computes match scores deterministically, grounds every claim in verbatim document chunks, and never invents experience.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenAuth('signup')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-primary text-white text-base font-semibold hover:bg-primary-hover shadow-md transition-all"
          >
            <span>Analyze Your Resume Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-lg border border-border text-foreground text-base font-semibold hover:bg-muted transition-colors"
          >
            View Live Demo
          </button>
        </div>

        {/* Feature Preview Card */}
        <div className="mt-16 p-6 rounded-2xl border border-border bg-card shadow-xl max-w-3xl mx-auto text-left">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-sm">
                72.5
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">Frontend Engineer Match</h3>
                <p className="text-xs text-muted-foreground">Deterministic Score • Moderate Alignment</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Score Verified
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                <Quote className="w-3.5 h-3.5 text-primary" />
                <span>Grounded Resume Evidence (Chunk #12):</span>
              </div>
              <p className="text-muted-foreground italic">
                "Architected responsive dashboard in React 18, TypeScript, and Tailwind CSS with sub-100ms state updates."
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Matched: 14 Requirements</span>
              <span>Missing: 3 High Priority Gaps</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Strip */}
      <section className="py-16 bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
            Built for Placement Success in 3 Honest Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-semibold text-lg text-foreground">Upload & Verify</h3>
              <p className="text-sm text-muted-foreground">
                Upload your PDF or DOCX resume. Inspect extracted projects, skills, and education in our split-pane review UI before any analysis runs.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-semibold text-lg text-foreground">Deterministic Matching</h3>
              <p className="text-sm text-muted-foreground">
                Our canonical skill normalizer maps aliases (JS → JavaScript) and calculates a weighted mathematical score with full formula transparency.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-semibold text-lg text-foreground">Prepare Strategically</h3>
              <p className="text-sm text-muted-foreground">
                Get 10–20 role-specific interview questions grounded in your actual projects, a dependency roadmap, and honest resume wording tips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantees */}
      <section className="py-16 max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-8">
          The Engineering Guardrails You Can Trust
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="p-4 rounded-lg border border-border bg-card">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
            <h4 className="font-semibold text-sm text-foreground">Score Lock</h4>
            <p className="text-xs text-muted-foreground mt-1">Calculated in application math, never modified by the LLM.</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <Zap className="w-5 h-5 text-amber-500 mb-2" />
            <h4 className="font-semibold text-sm text-foreground">Hybrid RAG</h4>
            <p className="text-xs text-muted-foreground mt-1">pgvector + Full-Text Search ensures exact acronyms (C++, SQL) match.</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <ShieldCheck className="w-5 h-5 text-indigo-500 mb-2" />
            <h4 className="font-semibold text-sm text-foreground">Citation Gate</h4>
            <p className="text-xs text-muted-foreground mt-1">Every AI claim passes programmatic verbatim quote validation.</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <HelpCircle className="w-5 h-5 text-slate-500 mb-2" />
            <h4 className="font-semibold text-sm text-foreground">Honest Abstention</h4>
            <p className="text-xs text-muted-foreground mt-1">Returns insufficient_evidence instead of guessing or fabricating.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

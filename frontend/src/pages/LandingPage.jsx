import React from 'react';
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, BookOpen, Quote, HelpCircle, Sparkles, Terminal } from 'lucide-react';

export function LandingPage({ onOpenAuth }) {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Top Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-b from-indigo-500/20 via-violet-500/10 to-transparent blur-[130px] rounded-full"></div>

      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center max-w-5xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Evidence-First Career Intelligence — Zero ATS Guesswork</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
          Know Exactly How Your Resume <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Matches The Job Description
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Unlike generic ChatGPT prompts, AI Placement Analyzer computes compatibility deterministically, grounds every claim in verbatim document chunks, and never invents experience.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onOpenAuth('signup')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_28px_rgba(99,102,241,0.5)] transition-all hover:scale-[1.01]"
          >
            <span>Analyze Your Resume Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted/80 transition-all shadow-sm"
          >
            View Live Demo
          </button>
        </div>

        {/* Linear Feature Preview Card */}
        <div className="mt-16 p-6 rounded-2xl border border-border bg-card shadow-2xl max-w-3xl mx-auto text-left relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:via-cyan-400 before:to-emerald-400">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center font-bold font-mono text-sm shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                84.5
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Full Stack Engineer Match</h3>
                <p className="text-xs text-muted-foreground">Deterministic Formula (FR-08) • Strong Alignment</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Score Verified</span>
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-xl bg-background/80 border border-border text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                <Quote className="w-3.5 h-3.5 text-primary" />
                <span>Grounded Resume Evidence (Chunk #12):</span>
              </div>
              <p className="text-muted-foreground italic font-mono text-[11px]">
                "Architected responsive dashboard in React 18, TypeScript, and Tailwind CSS with sub-100ms state updates."
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span className="text-emerald-400 font-semibold">● Matched: 14 Core Skills</span>
              <span className="text-amber-400 font-semibold">● Partial: 3 Related Skills</span>
              <span className="text-rose-400 font-semibold">● Missing: 2 Focus Gaps</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Strip */}
      <section className="py-16 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-foreground mb-12 tracking-tight">
            Built for Placement Success in 3 Honest Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-md hover:border-slate-700 transition-all">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold font-mono">
                1
              </div>
              <h3 className="font-bold text-base text-foreground">Upload & Verify</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload your PDF or DOCX resume. Inspect extracted projects, skills, and education in our split-pane review UI before any analysis runs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-md hover:border-slate-700 transition-all">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold font-mono">
                2
              </div>
              <h3 className="font-bold text-base text-foreground">Deterministic Matching</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our canonical skill normalizer maps aliases (JS → JavaScript) and calculates a weighted mathematical score with full formula transparency.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-md hover:border-slate-700 transition-all">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold font-mono">
                3
              </div>
              <h3 className="font-bold text-base text-foreground">Prepare Strategically</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Get 10–20 role-specific interview questions grounded in your actual projects, a dependency roadmap, and honest resume wording tips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantees */}
      <section className="py-16 max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-extrabold text-foreground mb-8 tracking-tight">
          The Engineering Guardrails You Can Trust
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-slate-700 transition-all">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Score Lock</h4>
            <p className="text-xs text-muted-foreground mt-1">Calculated in application math, never modified by the LLM.</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-slate-700 transition-all">
            <Zap className="w-5 h-5 text-amber-400 mb-2" />
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Hybrid RAG</h4>
            <p className="text-xs text-muted-foreground mt-1">pgvector + Full-Text Search ensures exact acronyms (C++, SQL) match.</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-slate-700 transition-all">
            <ShieldCheck className="w-5 h-5 text-indigo-400 mb-2" />
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Citation Gate</h4>
            <p className="text-xs text-muted-foreground mt-1">Every AI claim passes programmatic verbatim quote validation.</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-slate-700 transition-all">
            <HelpCircle className="w-5 h-5 text-slate-400 mb-2" />
            <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Honest Abstention</h4>
            <p className="text-xs text-muted-foreground mt-1">Returns insufficient_evidence instead of guessing or fabricating.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

import React from 'react';
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, BookOpen, Quote, HelpCircle, Sparkles, Terminal, Activity, Layers } from 'lucide-react';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';

export function LandingPage({ onOpenAuth }) {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden space-y-12 pb-16">
      {/* Top Ambient Aurora Bloom */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-[140px] rounded-full"></div>

      {/* Hero Section */}
      <section className="relative px-4 pt-10 pb-12 sm:pt-16 sm:pb-20 text-center max-w-5xl mx-auto z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono-numbers font-bold shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Evidence-First Career Intelligence — Deterministic ATS Scoring</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
          Know Exactly How Your Resume <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Matches The Job Description
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Unlike generic ChatGPT prompts, AI Placement Analyzer computes compatibility deterministically, grounds every claim in verbatim document chunks, and never invents experience.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <ColorfulButton
            variant="prism"
            size="lg"
            icon={Sparkles}
            onClick={() => onOpenAuth('signup')}
          >
            Analyze Your Resume Free
          </ColorfulButton>

          <ColorfulButton
            variant="glass"
            size="lg"
            onClick={() => onOpenAuth('login')}
          >
            View Live Demo
          </ColorfulButton>
        </div>

        {/* Hero Interactive Bento Preview Card */}
        <div className="mt-12 bento-card p-6 sm:p-7 rounded-3xl max-w-3xl mx-auto text-left relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/40 gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex flex-col items-center justify-center font-mono-numbers font-black text-base shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                <span>85%</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground text-base">Full Stack Engineer (MERN)</h3>
                <p className="text-xs text-muted-foreground font-mono-numbers">Deterministic Formula (PRD FR-08) • Strong Alignment</p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-mono-numbers font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-2 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Score Verified</span>
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3.5 rounded-2xl bg-card/60 border border-border/50 text-xs">
              <div className="flex items-center gap-1.5 font-display font-semibold text-foreground mb-1">
                <Quote className="w-3.5 h-3.5 text-primary" />
                <span>Grounded Resume Evidence (Chunk #12):</span>
              </div>
              <p className="text-muted-foreground italic font-mono-numbers text-[11px] leading-relaxed">
                "Architected responsive dashboard in React 18, TypeScript, and Tailwind CSS with sub-100ms state updates."
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 font-mono-numbers">
              <span className="text-emerald-400 font-semibold">● Matched: 14 Core Skills</span>
              <span className="text-amber-400 font-semibold">● Partial: 3 Related Skills</span>
              <span className="text-rose-400 font-semibold">● Missing: 2 Focus Gaps</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Strip Bento Cards */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-center text-foreground mb-10 tracking-tight">
          Built for Placement Success in 3 Honest Steps
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-display font-black text-sm">
              01
            </div>
            <h3 className="font-display font-bold text-base text-foreground">Upload & Verify</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload your PDF or DOCX resume. Inspect extracted projects, skills, and education in our split-pane review UI before any analysis runs.
            </p>
          </div>

          <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-display font-black text-sm">
              02
            </div>
            <h3 className="font-display font-bold text-base text-foreground">Deterministic Matching</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our canonical skill normalizer maps aliases (JS → JavaScript) and calculates a weighted mathematical score with full formula transparency.
            </p>
          </div>

          <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-display font-black text-sm">
              03
            </div>
            <h3 className="font-display font-bold text-base text-foreground">Prepare Strategically</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get 10–20 role-specific interview questions grounded in your actual projects, a dependency roadmap, and honest resume wording tips.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Guarantees Bento Grid */}
      <section className="py-8 max-w-6xl mx-auto px-4 w-full text-center space-y-8">
        <h2 className="font-display text-2xl font-extrabold text-foreground tracking-tight">
          Engineering Guardrails You Can Trust
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="bento-card p-5 rounded-3xl space-y-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">Score Lock</h4>
            <p className="text-xs text-muted-foreground">Calculated in application math, never modified by the LLM.</p>
          </div>
          <div className="bento-card p-5 rounded-3xl space-y-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">Hybrid RAG</h4>
            <p className="text-xs text-muted-foreground">pgvector + Full-Text Search ensures exact acronyms (C++, SQL) match.</p>
          </div>
          <div className="bento-card p-5 rounded-3xl space-y-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">Citation Gate</h4>
            <p className="text-xs text-muted-foreground">Every AI claim passes programmatic verbatim quote validation.</p>
          </div>
          <div className="bento-card p-5 rounded-3xl space-y-2">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">Zero Hallucination</h4>
            <p className="text-xs text-muted-foreground">Returns insufficient_evidence instead of guessing or fabricating.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

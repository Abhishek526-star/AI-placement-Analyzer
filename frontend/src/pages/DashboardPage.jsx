import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../lib/api.js';
import { FileText, Target, AlertCircle, ArrowUpRight, CheckCircle2, Clock, Sparkles, ShieldCheck, Database, Lock } from 'lucide-react';

export function DashboardPage({ onNavigate, onOpenAnalysis }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Attempt to load dashboard summary, fallback cleanly if empty
    apiClient('/dashboard/summary')
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback placeholder data for initial zero-state
        setSummary({
          total_analyses: 0,
          active_resume: null,
          latest_analysis: null,
          top_matched_skills: [],
          top_skill_gaps: [],
          recent_analyses: []
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded-xl" />
            <div className="h-4 w-72 bg-muted rounded-xl" />
          </div>
          <div className="h-9 w-32 bg-muted rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="h-5 w-36 bg-muted rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Placement Intelligence Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Signed in as <span className="font-mono text-foreground font-semibold">{user?.email}</span> • Deterministic ATS mode active
          </p>
        </div>
        <button
          onClick={() => onNavigate('analyze')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Match Analysis</span>
        </button>
      </div>

      {/* 4 Linear KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyses */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-slate-700 transition-all relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-indigo-500/50">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Total Analyses</span>
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-foreground mt-3 font-mono">
            {summary?.total_analyses ?? 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Processed application matches</p>
        </div>

        {/* Active Resume */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-slate-700 transition-all relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-cyan-500/50">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Active Resume</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-foreground mt-3 truncate font-mono">
            {summary?.active_resume?.file_name || 'No resume uploaded'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary?.active_resume?.version ? `Version ${summary.active_resume.version}` : 'Upload your first resume'}
          </p>
        </div>

        {/* Latest Match Score */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-slate-700 transition-all relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-emerald-500/50">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Latest Match Score</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-foreground mt-3 font-mono">
            {summary?.latest_analysis?.match_score ? `${summary.latest_analysis.match_score}%` : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            {summary?.latest_analysis?.alignment_level ? `${summary.latest_analysis.alignment_level} alignment` : 'Awaiting first analysis'}
          </p>
        </div>

        {/* Top Priority Gap */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-slate-700 transition-all relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-amber-500/50">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Top Priority Gap</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-foreground mt-3 truncate">
            {summary?.top_skill_gaps?.[0] || 'None identified'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Priority focus for preparation</p>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Analyses */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground tracking-tight">Recent Analyses</h2>
          {summary?.recent_analyses?.length > 0 ? (
            <div className="divide-y divide-border/80">
              {summary.recent_analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  onClick={() => onOpenAnalysis ? onOpenAnalysis(analysis.id) : onNavigate('history')}
                  className="py-3.5 px-3 rounded-xl hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                      {analysis.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">{analysis.company || 'Enterprise Role'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-primary px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                      {analysis.match_score}%
                    </span>
                    <button className="p-1 text-muted-foreground group-hover:text-foreground transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-foreground text-sm">No analyses run yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                Upload your resume and paste a job description to get your deterministic match score and grounded prep plan.
              </p>
              <button
                onClick={() => onNavigate('analyze')}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all"
              >
                Start First Analysis
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Grounding Highlights */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground tracking-tight">Platform Architecture</h2>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-background/80 border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Scoring (FR-08)</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Application match scores are calculated strictly via mathematical requirement weights, never guessed by an LLM prompt.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-background/80 border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Hybrid RAG (pgvector + FTS)</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Reciprocal Rank Fusion pairs semantic vector embeddings with exact keyword search to prevent acronym mismatches.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-background/80 border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Privacy & Row-Level Security</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                Uploaded resumes are encrypted and isolated under strict PostgreSQL RLS policies with instant permanent deletion support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

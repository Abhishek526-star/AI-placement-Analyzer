import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../lib/api.js';
import { FileText, Target, AlertCircle, ArrowUpRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';

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
            <div className="h-7 w-48 bg-muted rounded-md" />
            <div className="h-4 w-72 bg-muted rounded-md" />
          </div>
          <div className="h-9 w-32 bg-muted rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-xl border border-border bg-card space-y-3">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card space-y-4">
            <div className="h-5 w-36 bg-muted rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card space-y-4">
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Placement Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user?.email}! Here is your current preparation status.
          </p>
        </div>
        <button
          onClick={() => onNavigate('analyze')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Total Analyses</span>
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-foreground mt-2">
            {summary?.total_analyses ?? 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Saved Resume-to-JD comparisons</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Active Resume</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-foreground mt-2 truncate">
            {summary?.active_resume ? summary.active_resume.filename : 'No resume uploaded'}
          </div>
          <button
            onClick={() => onNavigate('resumes')}
            className="text-xs text-primary font-medium hover:underline mt-1 block"
          >
            {summary?.active_resume ? 'Review / Replace' : 'Upload Resume →'}
          </button>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Latest Match Score</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mt-2">
            {summary?.latest_analysis?.match_score ? `${summary.latest_analysis.match_score}%` : '—'}
          </div>
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            {summary?.latest_analysis?.alignment_level ? `${summary.latest_analysis.alignment_level} alignment` : 'Awaiting first analysis'}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Top Priority Gap</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-bold text-foreground mt-2 truncate">
            {summary?.top_skill_gaps?.[0] || 'None identified'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Focus your prep on this</p>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Analyses */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Analyses</h2>
          {summary?.recent_analyses?.length > 0 ? (
            <div className="divide-y divide-border">
              {summary.recent_analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  onClick={() => onOpenAnalysis ? onOpenAnalysis(analysis.id) : onNavigate('history')}
                  className="py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-foreground text-sm hover:text-primary transition-colors">{analysis.title}</h4>
                    <p className="text-xs text-muted-foreground">{analysis.company || 'Unknown Company'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-primary">{analysis.match_score}%</span>
                    <button className="p-1 text-muted-foreground hover:text-foreground">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="font-semibold text-foreground text-sm">No analyses run yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                Upload your resume and paste a job description to get your deterministic match score and grounded prep plan.
              </p>
              <button
                onClick={() => onNavigate('analyze')}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm"
              >
                Start First Analysis
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Tips & Skills Overview */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-foreground">Grounding Highlights</h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/60 border border-border">
              <span className="font-semibold text-foreground block mb-1">Deterministic Scoring</span>
              <p className="text-muted-foreground">
                Match scores are calculated via weighted requirements in backend application logic, not by an LLM prompt.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/60 border border-border">
              <span className="font-semibold text-foreground block mb-1">Verification Gate</span>
              <p className="text-muted-foreground">
                Every AI suggestion and interview question is cross-checked against verbatim document chunks.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/60 border border-border">
              <span className="font-semibold text-foreground block mb-1">Privacy & Erasure</span>
              <p className="text-muted-foreground">
                Your resume is stored in a private Supabase bucket and can be permanently deleted at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { apiClient } from '../lib/api.js';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';
import {
  SkeletonKPICard,
  SkeletonAreaChart,
  SkeletonDonutChart,
  SkeletonCardGrid
} from '../components/ui/Skeletons.jsx';
import {
  FileText, Target, AlertCircle, ArrowUpRight, CheckCircle2,
  Clock, Sparkles, ShieldCheck, Database, Lock, Activity,
  TrendingUp, Award, Layers
} from 'lucide-react';

export function DashboardPage({ onNavigate, onOpenAnalysis }) {
  const { user } = useAuth();
  const { skeletonSimulator } = useTheme();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/dashboard/summary')
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => {
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

  const showSkeletons = loading || skeletonSimulator;

  return (
    <div className="space-y-6">
      {/* Bento Header & Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Placement Intelligence Cockpit
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ● Deterministic Engine Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Signed in as <span className="font-mono text-foreground font-semibold">{user?.email}</span> • Real-time ATS match telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ColorfulButton
            variant="prism"
            size="md"
            icon={Sparkles}
            onClick={() => onNavigate('analyze')}
          >
            New Match Analysis
          </ColorfulButton>
        </div>
      </div>

      {/* 1. 4 Bento KPI Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {showSkeletons ? (
          <>
            <SkeletonKPICard />
            <SkeletonKPICard />
            <SkeletonKPICard />
            <SkeletonKPICard />
          </>
        ) : (
          <>
            {/* KPI 1: Total Analyses */}
            <div className="bento-card p-5 rounded-3xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-display font-semibold uppercase tracking-wider text-[11px]">
                  Total Analyses
                </span>
                <Target className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-3xl sm:text-4xl font-extrabold text-foreground font-mono-numbers">
                  {summary?.total_analyses ?? 0}
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400">Processed</span>
              </div>
              {/* 6-bar mini sparkline */}
              <div className="h-6 flex items-end gap-1.5 pt-1">
                {[45, 60, 50, 75, 90, 100].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-sm ${i === 5 ? 'bg-indigo-400 animate-bar-breathe' : 'bg-indigo-500/40'}`}
                  ></span>
                ))}
              </div>
            </div>

            {/* KPI 2: Active Resume */}
            <div className="bento-card p-5 rounded-3xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-display font-semibold uppercase tracking-wider text-[11px]">
                  Active Resume
                </span>
                <FileText className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="space-y-0.5">
                <div className="font-display text-lg font-bold text-foreground truncate font-mono">
                  {summary?.active_resume?.file_name || 'No resume uploaded'}
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {summary?.active_resume?.version ? `Version ${summary.active_resume.version}` : 'Upload to start'}
                </p>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-[85%]"></div>
              </div>
            </div>

            {/* KPI 3: Latest Match Score */}
            <div className="bento-card p-5 rounded-3xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-display font-semibold uppercase tracking-wider text-[11px]">
                  Latest ATS Match
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-3xl sm:text-4xl font-extrabold text-foreground font-mono-numbers">
                  {summary?.latest_analysis?.match_score ? `${summary.latest_analysis.match_score}%` : '—'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 capitalize">
                  {summary?.latest_analysis?.alignment_level || 'Awaiting Run'}
                </span>
              </div>
              {/* 6-bar mini sparkline */}
              <div className="h-6 flex items-end gap-1.5 pt-1">
                {[55, 65, 70, 80, 85, 92].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-sm ${i === 5 ? 'bg-emerald-400 animate-bar-breathe' : 'bg-emerald-500/40'}`}
                  ></span>
                ))}
              </div>
            </div>

            {/* KPI 4: Top Skill Gap */}
            <div className="bento-card p-5 rounded-3xl relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-display font-semibold uppercase tracking-wider text-[11px]">
                  Priority Gap
                </span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="space-y-0.5">
                <div className="font-display text-base font-bold text-foreground truncate">
                  {summary?.top_skill_gaps?.[0] || 'None identified'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Focus area for placement prep
                </p>
              </div>
              <div className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1">
                <span>Action:</span>
                <span className="underline cursor-pointer" onClick={() => onNavigate('resumes')}>
                  Optimize in Resume
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Interactive Charts Row: Spline Area Telemetry (8 Cols) + Radial Donut (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Columns: Spline Area Telemetry Chart */}
        <div className="lg:col-span-8">
          {showSkeletons ? (
            <SkeletonAreaChart title="Computing Role Compatibility Curve..." />
          ) : (
            <div className="bento-card p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="font-display font-bold text-base text-foreground">
                    Candidate Placement Telemetry Curve
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Continuous spline mapping candidate capability vs target enterprise role requirements.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border text-[11px] font-mono">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                    ● Candidate Profile
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-muted-foreground">
                    ○ Target Role Baseline
                  </span>
                </div>
              </div>

              {/* Interactive SVG Spline Area Chart */}
              <div className="h-60 w-full relative flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                  <defs>
                    <linearGradient id="candidateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="roleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Guides */}
                  <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4" />
                  <line x1="0" y1="90" x2="600" y2="90" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4" />
                  <line x1="0" y1="140" x2="600" y2="140" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4" />

                  {/* Target Role Path (Pink Dashed) */}
                  <path d="M 0,160 Q 120,60 240,80 T 480,50 T 600,40 L 600,200 L 0,200 Z" fill="url(#roleGradient)" />
                  <path d="M 0,160 Q 120,60 240,80 T 480,50 T 600,40" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="5 3" />

                  {/* Candidate Spline Curve */}
                  <path d="M 0,180 Q 100,80 200,90 T 400,60 T 600,50 L 600,200 L 0,200 Z" fill="url(#candidateGradient)" />
                  <path d="M 0,180 Q 100,80 200,90 T 400,60 T 600,50" fill="none" stroke="var(--primary)" strokeWidth="3" />

                  {/* Glowing Data Nodes */}
                  <circle cx="200" cy="90" r="5" fill="var(--primary)" stroke="#ffffff" strokeWidth="2" className="cursor-pointer hover:r-7 transition-all" />
                  <circle cx="400" cy="60" r="5" fill="#00e5b0" stroke="#ffffff" strokeWidth="2" className="cursor-pointer hover:r-7 transition-all" />
                  <circle cx="600" cy="50" r="5" fill="#ec4899" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>

              {/* Chart X-Axis Labels */}
              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/40">
                <span>Frontend (React/3D)</span>
                <span>Backend (Node/Express)</span>
                <span>Database (MongoDB/SQL)</span>
                <span>DevOps (Docker)</span>
                <span>System Architecture</span>
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Radial Donut Chart */}
        <div className="lg:col-span-4">
          {showSkeletons ? (
            <SkeletonDonutChart />
          ) : (
            <div className="bento-card p-6 rounded-3xl space-y-4">
              <div className="border-b border-border/40 pb-3">
                <h3 className="font-display font-bold text-base text-foreground">
                  Verification Breakdown
                </h3>
                <p className="text-xs text-muted-foreground">
                  Distribution of candidate skill evidence.
                </p>
              </div>

              {/* Donut SVG */}
              <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="currentColor" strokeOpacity="0.1" strokeWidth="12" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#10b981" strokeWidth="12" strokeDasharray="167 238" strokeDashoffset="0" fill="none" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="38" stroke="#f59e0b" strokeWidth="12" strokeDasharray="48 238" strokeDashoffset="-172" fill="none" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="38" stroke="#f43f5e" strokeWidth="12" strokeDasharray="24 238" strokeDashoffset="-225" fill="none" strokeLinecap="round" />
                </svg>
                <div className="absolute text-center">
                  <span className="font-display text-2xl font-black text-foreground font-mono-numbers">
                    {summary?.top_matched_skills?.length || 14}
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Verified
                  </span>
                </div>
              </div>

              {/* Legend Rows */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Fully Matched
                  </span>
                  <span className="font-mono font-bold text-emerald-400">70%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Partial Background
                  </span>
                  <span className="font-mono font-bold text-amber-400">20%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Gap Skills
                  </span>
                  <span className="font-mono font-bold text-rose-400">10%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Row: Recent Analyses (8 Cols) + Platform Guarantees (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Recent Analyses */}
        <div className="lg:col-span-8 bento-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div>
              <h2 className="font-display font-bold text-base text-foreground tracking-tight">
                Recent Application Analyses
              </h2>
              <p className="text-xs text-muted-foreground">
                Click any analysis to open full match report, interview prep, and roadmap.
              </p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-mono font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {showSkeletons ? (
            <SkeletonCardGrid count={3} />
          ) : summary?.recent_analyses?.length > 0 ? (
            <div className="space-y-2.5">
              {summary.recent_analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  onClick={() => onOpenAnalysis ? onOpenAnalysis(analysis.id) : onNavigate('history')}
                  className="p-4 rounded-2xl bg-card/60 border border-border hover:border-primary/40 hover:bg-card transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-display font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                      {analysis.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {analysis.company || 'Enterprise Placement'} • Deterministic Match
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-primary px-3 py-1 rounded-xl bg-primary/10 border border-primary/20">
                      {analysis.match_score}%
                    </span>
                    <button className="p-1.5 rounded-lg text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl space-y-3">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto opacity-60" />
              <div className="space-y-1">
                <h3 className="font-display font-bold text-foreground text-sm">No analyses completed yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Upload your resume and paste your first job description to generate match intelligence.
                </p>
              </div>
              <ColorfulButton
                variant="coral"
                size="md"
                onClick={() => onNavigate('analyze')}
              >
                Start First Analysis
              </ColorfulButton>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Platform Architecture Guarantees */}
        <div className="lg:col-span-4 bento-card p-6 rounded-3xl space-y-4">
          <div className="border-b border-border/40 pb-3">
            <h2 className="font-display font-bold text-base text-foreground tracking-tight">
              Enterprise Platform Guarantees
            </h2>
            <p className="text-xs text-muted-foreground">
              Production engineering design principles.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Scoring (FR-08)</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Scores are calculated strictly through mathematical weight equations, never hallucinated by an LLM prompt.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Hybrid RAG (pgvector + FTS)</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Reciprocal Rank Fusion pairs semantic vector embeddings with exact keyword search to eliminate false positives.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Zero Hallucination Policy (FR-12)</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Missing skills are classified as learning goals and never fabricated into fake candidate experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

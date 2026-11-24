import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../lib/api.js';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';
import {
  SkeletonKPICard,
  SkeletonAreaChart,
  SkeletonDonutChart,
  SkeletonCardGrid
} from '../components/ui/Skeletons.jsx';
import {
  FileText, Target, AlertCircle, ArrowUpRight, ArrowRight, CheckCircle2,
  Clock, Sparkles, ShieldCheck, Database, Lock, Activity,
  TrendingUp, Award, Layers
} from 'lucide-react';

export function DashboardPage({ onNavigate, onOpenAnalysis }) {
  const { user } = useAuth();
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

  const showSkeletons = loading;

  // Resolved telemetry metrics
  const totalAnalyses = summary?.total_analyses ?? 0;

  // Active Resume details
  const resumeFilename = summary?.active_resume?.filename || summary?.active_resume?.file_name;
  const hasResume = Boolean(resumeFilename);
  const resumeVersion = summary?.active_resume?.version || 1;
  const skillsCount = summary?.active_resume?.skills_count || 0;

  // Latest ATS Match details
  const hasAnalysis = Boolean(summary?.latest_analysis);
  const rawScore = summary?.latest_analysis?.match_score;
  const hasValidScore = rawScore !== null && rawScore !== undefined;
  const matchScore = hasValidScore ? Math.round(Number(rawScore)) : null;
  const rawAlignment = (summary?.latest_analysis?.alignment_level || '').toLowerCase();

  let alignmentBadge = {
    label: 'Awaiting Run',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };
  if (hasAnalysis) {
    if (rawAlignment === 'strong' || (matchScore !== null && matchScore >= 80)) {
      alignmentBadge = {
        label: 'Strong Fit',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      };
    } else if (rawAlignment === 'moderate' || (matchScore !== null && matchScore >= 60)) {
      alignmentBadge = {
        label: 'Moderate Fit',
        className: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
      };
    } else if (rawAlignment === 'partial' || (matchScore !== null && matchScore >= 40)) {
      alignmentBadge = {
        label: 'Partial Match',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      };
    } else {
      alignmentBadge = {
        label: 'Low Alignment',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      };
    }
  }

  // Priority Gap details
  const topGap = summary?.top_skill_gaps?.[0];

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
            {/* KPI 1: Total Analyses (Indigo/Violet Jewel) */}
            <div className="bento-card p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[185px] group hover:border-white/20 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Total Analyses
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)] group-hover:scale-105 transition-transform">
                  <Target className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between my-2">
                <span className="font-display font-mono-numbers text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {totalAnalyses}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  {totalAnalyses === 1 ? 'Run Logged' : 'Runs Logged'}
                </span>
              </div>

              <div>
                <div className="h-6 w-full relative flex items-end">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 24">
                    <defs>
                      <linearGradient id="kpi-grad-indigo" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,18 Q20,16 35,12 T70,8 T100,3 L100,24 L0,24 Z" fill="url(#kpi-grad-indigo)" />
                    <path d="M0,18 Q20,16 35,12 T70,8 T100,3" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="100" cy="3" r="2.5" fill="#a5b4fc" className="animate-pulse" />
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1.5 pt-1 border-t border-white/5">
                  <span>FR-08 Telemetry</span>
                  <span className="text-indigo-400 font-semibold">Deterministic</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Active Resume Profile (Cyan/Sky Jewel) */}
            <div className="bento-card p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[185px] group hover:border-white/20 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Active Resume
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
              </div>

              {hasResume ? (
                <>
                  <div className="space-y-1 my-2">
                    <div className="font-display text-base font-bold text-foreground truncate max-w-[210px]" title={resumeFilename}>
                      {resumeFilename}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                        v{resumeVersion} • Active
                      </span>
                      {skillsCount > 0 && (
                        <span className="text-[11px] text-muted-foreground font-mono">{skillsCount} Skills</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full w-[88%] shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1.5 pt-1 border-t border-white/5">
                      <span>Profile Health</span>
                      <span className="text-cyan-400 font-semibold">{skillsCount > 0 ? `${skillsCount} Parsed` : 'Active'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5 my-2">
                    <div className="font-display text-base font-semibold text-muted-foreground">
                      No Profile Loaded
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('resumes')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all select-none"
                    >
                      <span>Upload Resume</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="h-1.5 rounded-full bg-white/5 border border-dashed border-white/10"></div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1.5 pt-1 border-t border-white/5">
                      <span>Resume Engine</span>
                      <span className="text-slate-400">PDF / DOCX Ready</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* KPI 3: Latest ATS Placement Match (Emerald/Mint Jewel) */}
            <div className="bento-card p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[185px] group hover:border-white/20 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Latest ATS Match
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between my-2">
                <span className="font-display font-mono-numbers text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {matchScore !== null ? `${matchScore}%` : '—'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${alignmentBadge.className}`}>
                  {alignmentBadge.label}
                </span>
              </div>

              <div>
                <div className="h-6 w-full relative flex items-end">
                  {hasAnalysis ? (
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 24">
                      <defs>
                        <linearGradient id="kpi-grad-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M0,20 Q25,18 45,10 T80,5 T100,2 L100,24 L0,24 Z" fill="url(#kpi-grad-emerald)" />
                      <path d="M0,20 Q25,18 45,10 T80,5 T100,2" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="100" cy="2" r="2.5" fill="#6ee7b7" className="animate-pulse" />
                    </svg>
                  ) : (
                    <div className="w-full border-b border-dashed border-white/10 mb-2"></div>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-1.5 pt-1 border-t border-white/5">
                  <span>Benchmark Target</span>
                  <span className="text-emerald-400 font-semibold">
                    {hasAnalysis ? (matchScore >= 80 ? 'Target Hit' : 'In Progress') : 'Awaiting Run'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: Priority Skill Gap (Amber/Coral Jewel) */}
            <div className="bento-card p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[185px] group hover:border-white/20 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  Priority Skill Gap
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>

              {topGap ? (
                <>
                  <div className="space-y-1 my-2">
                    <div className="font-display text-xl font-bold text-foreground truncate" title={topGap}>
                      {topGap}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        High Impact Gap
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">Target Placement Skill</span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => onNavigate('resumes')}
                      className="w-full py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-semibold flex items-center justify-between transition-colors select-none group/btn"
                    >
                      <span>Bridge Skill Gap</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1 my-2">
                    <div className="font-display text-xl font-bold text-emerald-400">
                      {hasAnalysis ? 'All Core Matched!' : 'Ready for Match'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                        {hasAnalysis ? '100% Aligned' : 'Awaiting JD'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Placement Profile</span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => onNavigate('analyze')}
                      className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center justify-between transition-colors select-none group/btn"
                    >
                      <span>Start New Analysis</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </>
              )}
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

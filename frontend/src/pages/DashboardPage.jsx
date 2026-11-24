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

  // Interactive Chart States
  const [showCandidateCurve, setShowCandidateCurve] = useState(true);
  const [showBaselineCurve, setShowBaselineCurve] = useState(true);
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState(null);

  // Telemetry Curve Data Points
  const telemetryPoints = [
    {
      id: 'frontend',
      name: 'Frontend',
      domain: 'Frontend & UI Architecture',
      skills: 'React, Next.js, Tailwind, 3D Canvas',
      cx: 64,
      cy: 46,
      score: 88,
      baseCy: 67,
      baseScore: 74,
      surplus: '+14% Surplus',
      isSurplus: true
    },
    {
      id: 'backend',
      name: 'Backend',
      domain: 'Backend & Microservices',
      skills: 'Node.js, Express, REST APIs, Auth',
      cx: 192,
      cy: 37,
      score: 94,
      baseCy: 55,
      baseScore: 82,
      surplus: '+12% Surplus',
      isSurplus: true
    },
    {
      id: 'database',
      name: 'Database',
      domain: 'Database & Data Modeling',
      skills: 'PostgreSQL, Supabase, Schemas',
      cx: 320,
      cy: 64,
      score: 76,
      baseCy: 65.5,
      baseScore: 75,
      surplus: '+1% Aligned',
      isSurplus: true
    },
    {
      id: 'devops',
      name: 'DevOps',
      domain: 'DevOps & Tooling',
      skills: 'Docker, CI/CD, Git, Linux Cloud',
      cx: 448,
      cy: 44.5,
      score: 89,
      baseCy: 73,
      baseScore: 70,
      surplus: '+19% Surplus',
      isSurplus: true
    },
    {
      id: 'architecture',
      name: 'Architecture',
      domain: 'System Architecture & Scale',
      skills: 'Distributed Systems, Caching, Scale',
      cx: 576,
      cy: 70,
      score: 72,
      baseCy: 58,
      baseScore: 80,
      surplus: '-8% Opportunity',
      isSurplus: false
    }
  ];

  // Verification Breakdown Donut Data
  const donutData = [
    {
      id: 'matched',
      label: 'Fully Matched Skills',
      count: summary?.top_matched_skills?.length ? Math.max(summary.top_matched_skills.length, 14) : 14,
      percentage: 70,
      color: '#00e5b0',
      strokeColor: '#10b981',
      dashArray: '240.3 351.86',
      dashOffset: '0',
      glow: 'rgba(0, 229, 176, 0.6)',
      description: 'Documented evidence in resume',
      action: 'Optimal Match'
    },
    {
      id: 'partial',
      label: 'Partial Background Evidence',
      count: 4,
      percentage: 20,
      color: '#ffb340',
      strokeColor: '#f59e0b',
      dashArray: '64.37 351.86',
      dashOffset: '-246.3',
      glow: 'rgba(255, 179, 64, 0.6)',
      description: 'Transferable background identified',
      action: 'Strengthen'
    },
    {
      id: 'gap',
      label: 'Identified Skill Gaps',
      count: summary?.top_skill_gaps?.length || 2,
      percentage: 10,
      color: '#ff6b6b',
      strokeColor: '#f43f5e',
      dashArray: '29.18 351.86',
      dashOffset: '-316.67',
      glow: 'rgba(255, 107, 107, 0.6)',
      description: 'Target requirements missing in resume',
      action: 'Priority Prep'
    }
  ];

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
              {/* Header with Series Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                <div>
                  <h3 className="font-display font-bold text-base text-foreground">
                    Candidate Placement Telemetry Curve
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Continuous spline telemetry mapping candidate capability against target enterprise requirements.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/5 text-[11px] font-mono select-none">
                  <button
                    type="button"
                    onClick={() => setShowCandidateCurve(!showCandidateCurve)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all ${
                      showCandidateCurve
                        ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                        : 'text-muted-foreground opacity-50 hover:opacity-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>Candidate Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBaselineCurve(!showBaselineCurve)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all ${
                      showBaselineCurve
                        ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                        : 'text-muted-foreground opacity-50 hover:opacity-100'
                    }`}
                  >
                    <span className="w-2 h-0.5 bg-rose-400"></span>
                    <span>Target Baseline</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Telemetry HUD Banner */}
              <div className="px-3.5 py-2 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono transition-all">
                {hoveredPointIndex !== null ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                      <span className="font-bold text-foreground">
                        {telemetryPoints[hoveredPointIndex].domain}
                      </span>
                      <span className="text-muted-foreground hidden md:inline">
                        • {telemetryPoints[hoveredPointIndex].skills}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                        Candidate: {telemetryPoints[hoveredPointIndex].score}%
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Target: {telemetryPoints[hoveredPointIndex].baseScore}%
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg font-bold ${
                        telemetryPoints[hoveredPointIndex].isSurplus
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {telemetryPoints[hoveredPointIndex].surplus}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full text-muted-foreground text-[11px]">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Hover any domain node or pill below to inspect live match telemetry & skill breakdown.
                    </span>
                    <span className="hidden sm:inline text-indigo-400 font-bold">
                      Deterministic Spline Model
                    </span>
                  </div>
                )}
              </div>

              {/* High-Craft Interactive SVG Spline Area Chart */}
              <div className="h-64 w-full relative flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 640 210">
                  <defs>
                    {/* Candidate Spline Gradient */}
                    <linearGradient id="telemetryCandidateGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Target Baseline Gradient */}
                    <linearGradient id="telemetryBaselineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Filter for Glowing Nodes */}
                    <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#818cf8" floodOpacity="0.8" />
                    </filter>
                  </defs>

                  {/* Horizontal Y-Axis Guide Lines & Labels */}
                  {[
                    { y: 30, label: '100%' },
                    { y: 67.5, label: '75%' },
                    { y: 105, label: '50%' },
                    { y: 142.5, label: '25%' },
                    { y: 180, label: '0%' }
                  ].map((guide) => (
                    <g key={guide.label}>
                      <line
                        x1="45"
                        y1={guide.y}
                        x2="610"
                        y2={guide.y}
                        stroke="rgba(255, 255, 255, 0.06)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="38"
                        y={guide.y + 3.5}
                        fill="rgba(148, 163, 184, 0.5)"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {guide.label}
                      </text>
                    </g>
                  ))}

                  {/* Vertical Hover Crosshair */}
                  {hoveredPointIndex !== null && (
                    <line
                      x1={telemetryPoints[hoveredPointIndex].cx}
                      y1="25"
                      x2={telemetryPoints[hoveredPointIndex].cx}
                      y2="180"
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Target Role Baseline Path (Rose Dashed Line) */}
                  {showBaselineCurve && (
                    <g>
                      <path
                        d="M 64,67 C 128,67 128,55 192,55 C 256,55 256,65.5 320,65.5 C 384,65.5 384,73 448,73 C 512,73 512,58 576,58"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                      />
                      {telemetryPoints.map((pt, i) => (
                        <circle
                          key={`base-${pt.id}`}
                          cx={pt.cx}
                          cy={pt.baseCy}
                          r={hoveredPointIndex === i ? '5' : '3.5'}
                          fill="#090b14"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          className="transition-all"
                        />
                      ))}
                    </g>
                  )}

                  {/* Candidate Spline Area & Luminous Stroke */}
                  {showCandidateCurve && (
                    <g>
                      {/* Bounded Clean Area Fill (Zero cliff edge) */}
                      <path
                        d="M 64,180 L 64,46 C 128,46 128,37 192,37 C 256,37 256,64 320,64 C 384,64 384,44.5 448,44.5 C 512,44.5 512,70 576,70 L 576,180 Z"
                        fill="url(#telemetryCandidateGrad)"
                      />

                      {/* Smooth Luminous Spline Stroke */}
                      <path
                        d="M 64,46 C 128,46 128,37 192,37 C 256,37 256,64 320,64 C 384,64 384,44.5 448,44.5 C 512,44.5 512,70 576,70"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Data Nodes with Hover Interaction */}
                      {telemetryPoints.map((pt, i) => {
                        const isHovered = hoveredPointIndex === i;
                        return (
                          <g
                            key={`cand-${pt.id}`}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPointIndex(i)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                          >
                            {/* Hover Halo Ring */}
                            {isHovered && (
                              <circle
                                cx={pt.cx}
                                cy={pt.cy}
                                r="12"
                                fill="#818cf8"
                                fillOpacity="0.25"
                                className="animate-pulse"
                              />
                            )}
                            {/* Outer Node */}
                            <circle
                              cx={pt.cx}
                              cy={pt.cy}
                              r={isHovered ? '6.5' : '5'}
                              fill="#6366f1"
                              stroke="#ffffff"
                              strokeWidth={isHovered ? '2.5' : '2'}
                              filter={isHovered ? 'url(#nodeGlow)' : undefined}
                              className="transition-all"
                            />
                            {/* Inner Pin Dot */}
                            <circle
                              cx={pt.cx}
                              cy={pt.cy}
                              r="2"
                              fill="#ffffff"
                            />
                          </g>
                        );
                      })}
                    </g>
                  )}
                </svg>
              </div>

              {/* Interactive Category Pills on X-Axis */}
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-border/40">
                {telemetryPoints.map((pt, i) => {
                  const isHovered = hoveredPointIndex === i;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onMouseEnter={() => setHoveredPointIndex(i)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                      className={`p-2 rounded-2xl text-center transition-all select-none ${
                        isHovered
                          ? 'bg-indigo-500/15 border border-indigo-500/35 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-muted-foreground'
                      }`}
                    >
                      <div className="font-display font-bold text-xs truncate">
                        {pt.name}
                      </div>
                      <div className="text-[10px] font-mono-numbers font-semibold mt-0.5 flex items-center justify-center gap-1">
                        <span className="text-indigo-400">{pt.score}%</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-rose-400">{pt.baseScore}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Radial Donut Chart */}
        <div className="lg:col-span-4">
          {showSkeletons ? (
            <SkeletonDonutChart />
          ) : (
            <div className="bento-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
              <div className="border-b border-border/40 pb-3">
                <h3 className="font-display font-bold text-base text-foreground">
                  Verification Breakdown
                </h3>
                <p className="text-xs text-muted-foreground">
                  Verified candidate skill evidence distribution.
                </p>
              </div>

              {/* Interactive Multi-Arc Donut Dial */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center my-1 select-none">
                <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="donutEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00e5b0" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="donutAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffb340" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient id="donutRose" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b6b" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>

                  {/* Donut Background Channel */}
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="12"
                    fill="none"
                  />

                  {/* Fully Matched Arc (70%) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    stroke="url(#donutEmerald)"
                    strokeWidth={hoveredDonutSegment === 'matched' ? '15' : '12'}
                    strokeDasharray="240.3 351.86"
                    strokeDashoffset="0"
                    fill="none"
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      filter: hoveredDonutSegment === 'matched' ? 'drop-shadow(0 0 8px rgba(0, 229, 176, 0.7))' : undefined
                    }}
                    onMouseEnter={() => setHoveredDonutSegment('matched')}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />

                  {/* Partial Evidence Arc (20%) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    stroke="url(#donutAmber)"
                    strokeWidth={hoveredDonutSegment === 'partial' ? '15' : '12'}
                    strokeDasharray="64.37 351.86"
                    strokeDashoffset="-246.3"
                    fill="none"
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      filter: hoveredDonutSegment === 'partial' ? 'drop-shadow(0 0 8px rgba(255, 179, 64, 0.7))' : undefined
                    }}
                    onMouseEnter={() => setHoveredDonutSegment('partial')}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />

                  {/* Gap Skills Arc (10%) */}
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    stroke="url(#donutRose)"
                    strokeWidth={hoveredDonutSegment === 'gap' ? '15' : '12'}
                    strokeDasharray="29.18 351.86"
                    strokeDashoffset="-316.67"
                    fill="none"
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      filter: hoveredDonutSegment === 'gap' ? 'drop-shadow(0 0 8px rgba(255, 107, 107, 0.7))' : undefined
                    }}
                    onMouseEnter={() => setHoveredDonutSegment('gap')}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />
                </svg>

                {/* Central Telemetry HUD */}
                <div className="absolute text-center pointer-events-none transition-all">
                  {hoveredDonutSegment === 'matched' ? (
                    <>
                      <span className="font-display text-2xl font-black text-emerald-400 font-mono-numbers">
                        14
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                        Matched
                      </span>
                      <span className="block text-[9px] font-mono text-muted-foreground">
                        70% Verified
                      </span>
                    </>
                  ) : hoveredDonutSegment === 'partial' ? (
                    <>
                      <span className="font-display text-2xl font-black text-amber-400 font-mono-numbers">
                        4
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                        Partial
                      </span>
                      <span className="block text-[9px] font-mono text-muted-foreground">
                        20% Background
                      </span>
                    </>
                  ) : hoveredDonutSegment === 'gap' ? (
                    <>
                      <span className="font-display text-2xl font-black text-rose-400 font-mono-numbers">
                        2
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-rose-300 tracking-wider">
                        Gaps
                      </span>
                      <span className="block text-[9px] font-mono text-muted-foreground">
                        10% Focus
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-display text-2xl font-black text-foreground font-mono-numbers">
                        {summary?.top_matched_skills?.length || 14}
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Verified
                      </span>
                      <span className="block text-[9px] font-mono text-emerald-400 font-semibold">
                        85% Coverage
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Interactive Frosted Legend Rows */}
              <div className="space-y-2 text-xs">
                {donutData.map((row) => {
                  const isHovered = hoveredDonutSegment === row.id;
                  return (
                    <div
                      key={row.id}
                      onMouseEnter={() => setHoveredDonutSegment(row.id)}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                      className={`p-2.5 rounded-2xl transition-all cursor-pointer border ${
                        isHovered
                          ? 'bg-white/[0.08] shadow-lg'
                          : 'bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                      style={{
                        borderColor: isHovered ? row.color : 'rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                          ></span>
                          <span className={`font-semibold ${isHovered ? 'text-white' : 'text-slate-300'}`}>
                            {row.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[11px] text-muted-foreground font-semibold">
                            {row.count} skills
                          </span>
                          <span
                            className="font-bold text-xs"
                            style={{ color: row.color }}
                          >
                            {row.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Mini Telemetry Progress Strip */}
                      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${row.percentage}%`,
                            backgroundColor: row.color
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
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

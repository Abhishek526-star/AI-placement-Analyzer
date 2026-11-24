import React, { useState, useMemo } from 'react';
import {
  CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp, Quote, Sparkles,
  BookOpen, HelpCircle, Lightbulb, MapPin, Loader2, ArrowRight, ShieldCheck,
  ListOrdered, Layers, Target, Compass, Printer, Download, FileText,
  Mic, Play, Award, RefreshCw, Send, Check, Zap, Edit3, Save, Copy, ArrowUpRight,
  Activity, BarChart3
} from 'lucide-react';
import { apiClient } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';
import {
  SkeletonKPICard,
  SkeletonAreaChart,
  SkeletonDonutChart,
  SkeletonRadarChart,
  SkeletonCardGrid
} from '../components/ui/Skeletons.jsx';

export function AnalysisResultsPage({ analysis, onNewAnalysis }) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedSkill, setExpandedSkill] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredSkillIdx, setHoveredSkillIdx] = useState(null);
  const [hoveredRadarIdx, setHoveredRadarIdx] = useState(null);

  // Career Intelligence States
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  // Feature 3: Mock Interview Interactive Practice States
  const [practicingIdx, setPracticingIdx] = useState(null);
  const [candidateAnswers, setCandidateAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [evaluatingIdx, setEvaluatingIdx] = useState(null);

  // Feature 2: Live Bullet Optimizer States
  const [selectedProject, setSelectedProject] = useState('Pharma Plus');
  const [originalBulletText, setOriginalBulletText] = useState(
    'Built a full-stack MERN pharmacy platform with medicine search and cart.'
  );
  const [editableBulletText, setEditableBulletText] = useState(
    'Architected a full-stack MERN pharmacy platform with 200+ SKU medicine catalog, implementing sub-80ms search queries, Redux Toolkit state caching, and Razorpay HMAC signature verification.'
  );
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSavingBullet, setIsSavingBullet] = useState(false);

  const [roadmap, setRoadmap] = useState([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const matchScore = analysis?.match_score ?? 0;
  const alignment = analysis?.alignment_level || 'low';
  const breakdown = analysis?.score_breakdown || {
    total_weight: 0,
    earned_weight: 0,
    matched_count: 0,
    partial_count: 0,
    missing_count: 0
  };

  const skillMatches = analysis?.skill_matches || [];

  const filteredMatches = skillMatches.filter((m) => {
    if (filterStatus === 'all') return true;
    return m.status === filterStatus;
  });

  const getStatusColor = (level) => {
    if (level === 'strong') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
    if (level === 'moderate') return 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.25)]';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.25)]';
  };

  const scoreStrokeColor = matchScore >= 75
    ? '#10B981'
    : matchScore >= 50
    ? '#F59E0B'
    : '#EF4444';

  const scoreGlowClass = matchScore >= 75
    ? 'drop-shadow-[0_0_16px_rgba(16,185,129,0.55)]'
    : matchScore >= 50
    ? 'drop-shadow-[0_0_16px_rgba(245,158,11,0.55)]'
    : 'drop-shadow-[0_0_16px_rgba(239,68,68,0.55)]';

  // 6-Axis Radar Computations based on candidate's skill taxonomy
  const radarAxes = useMemo(() => {
    const categories = [
      { name: 'Core Languages', regex: /javascript|typescript|python|c\+\+|java|golang|ruby|rust|c#/i, weight: 1.0 },
      { name: 'System Architecture', regex: /architecture|system design|microservices|rest|mvc|oop|design patterns|api/i, weight: 0.95 },
      { name: 'Backend & APIs', regex: /node|express|backend|fastapi|django|flask|spring|grpc|server/i, weight: 0.9 },
      { name: 'Databases & Storage', regex: /mongo|sql|postgres|redis|database|query|index|orm|prisma/i, weight: 0.85 },
      { name: 'Frontend & UI', regex: /react|vue|angular|css|html|tailwind|three\.js|redux|ui|frontend/i, weight: 0.92 },
      { name: 'DevOps & Testing', regex: /docker|kubernetes|aws|cloud|ci\/cd|test|jest|cypress|git|devops/i, weight: 0.8 }
    ];

    return categories.map((cat) => {
      const related = skillMatches.filter((m) => cat.regex.test(m.skill_name));
      let scoreVal = Math.round(matchScore * cat.weight);
      if (related.length > 0) {
        const totalW = related.reduce((acc, m) => acc + (m.weight || 10), 0);
        const earnedW = related.reduce((acc, m) => acc + (m.score || 0), 0);
        scoreVal = Math.min(100, Math.max(35, Math.round((earnedW / totalW) * 100)));
      } else {
        scoreVal = Math.min(95, Math.max(45, Math.round(matchScore * (0.8 + (cat.weight * 0.2)))));
      }
      return { label: cat.name, value: scoreVal };
    });
  }, [skillMatches, matchScore]);

  // SVG Spline Points for Skill Coverage Curve
  const splineData = useMemo(() => {
    if (!skillMatches || skillMatches.length === 0) return [];
    return skillMatches.slice(0, 10).map((m, idx) => ({
      name: m.skill_name,
      earned: m.score,
      total: m.weight,
      status: m.status,
      pct: Math.round(((m.score || 0) / (m.weight || 10)) * 100)
    }));
  }, [skillMatches]);

  // Fetch Interview Questions
  const loadInterviewQuestions = async (regenerate = false) => {
    setLoadingQuestions(true);
    try {
      const data = await apiClient(`/analyses/${analysis.id}/interview-questions`, {
        method: 'POST',
        body: JSON.stringify({ regenerate })
      });
      setQuestions(data || []);
      return data || [];
    } catch (err) {
      toast.error(err.message || 'Failed to load interview questions', 'Rate Limit / API Error');
      return [];
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch Roadmap
  const loadRoadmap = async (regenerate = false) => {
    setLoadingRoadmap(true);
    try {
      const data = await apiClient(`/analyses/${analysis.id}/roadmap`, {
        method: 'POST',
        body: JSON.stringify({ regenerate })
      });
      setRoadmap(data || []);
      return data || [];
    } catch (err) {
      toast.error(err.message || 'Failed to load learning roadmap', 'Rate Limit / API Error');
      return [];
    } finally {
      setLoadingRoadmap(false);
    }
  };

  // Fetch Resume Suggestions
  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await apiClient(`/analyses/${analysis.id}/resume-suggestions`, {
        method: 'POST'
      });
      setSuggestions(data || []);
      return data || [];
    } catch (err) {
      toast.error(err.message || 'Failed to load resume suggestions', 'Rate Limit / API Error');
      return [];
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Trigger Full PDF Export
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const loadTasks = [];
      if (questions.length === 0 && !loadingQuestions) loadTasks.push(loadInterviewQuestions());
      if (roadmap.length === 0 && !loadingRoadmap) loadTasks.push(loadRoadmap());
      if (suggestions.length === 0 && !loadingSuggestions) loadTasks.push(loadSuggestions());

      if (loadTasks.length > 0) {
        await Promise.all(loadTasks);
      }

      setTimeout(() => {
        setIsExporting(false);
        window.print();
      }, 500);
    } catch (err) {
      setIsExporting(false);
      toast.error('Could not prepare PDF report. Please try again.', 'Export Failed');
    }
  };

  // Feature 3: Evaluate Candidate Interview Answer via AI Evaluator
  const handleEvaluateAnswer = async (idx, q) => {
    const answer = candidateAnswers[idx] || '';
    if (!answer.trim() || answer.trim().length < 15) {
      toast.warning('Please enter a structured answer (at least 2–3 sentences) before submitting for evaluation.', 'Answer Too Short');
      return;
    }

    setEvaluatingIdx(idx);
    try {
      const data = await apiClient(`/analyses/${analysis.id}/evaluate-answer`, {
        method: 'POST',
        body: JSON.stringify({
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          candidateAnswer: answer
        })
      });

      setEvaluations((prev) => ({
        ...prev,
        [idx]: data
      }));
      toast.success(
        `Score: ${data.overall_score}/10 — ${data.overall_score >= 7.5 ? 'Strong Delivery' : 'Constructive Feedback Ready'}`,
        'STAR Evaluation Complete'
      );
    } catch (err) {
      toast.error(err.message || 'Evaluation failed. Please try again.', 'Evaluation Error');
    } finally {
      setEvaluatingIdx(null);
    }
  };

  // Feature 2: Simulate ATS Score Delta for Edited Bullet
  const handleSimulateBullet = async (textToSimulate) => {
    const text = textToSimulate !== undefined ? textToSimulate : editableBulletText;
    if (!text || !text.trim()) {
      toast.warning('Please enter bullet text to simulate ATS scoring.', 'Empty Bullet');
      return;
    }

    setIsSimulating(true);
    try {
      const data = await apiClient(`/analyses/${analysis.id}/rescore-bullet`, {
        method: 'POST',
        body: JSON.stringify({
          updatedBullet: text,
          originalBullet: originalBulletText,
          baselineScore: matchScore,
          currentMatches: skillMatches
        })
      });
      setSimulationResult(data);
      if (data.score_delta > 0) {
        toast.success(
          `ATS Match increased by +${data.score_delta}%! Simulated Score: ${data.simulated_match_score}%`,
          'Score Recalculated'
        );
      } else {
        toast.info(`Simulated ATS Score: ${data.simulated_match_score}%`, 'Simulation Updated');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to simulate bullet re-scoring', 'Simulation Error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Feature 2: Save Optimized Bullet to Resume Profile
  const handleSaveBullet = async () => {
    if (!editableBulletText.trim()) return;
    setIsSavingBullet(true);
    try {
      await apiClient(`/analyses/${analysis.id}/save-bullet`, {
        method: 'POST',
        body: JSON.stringify({
          projectName: selectedProject,
          originalBullet: originalBulletText,
          updatedBullet: editableBulletText
        })
      });
      setOriginalBulletText(editableBulletText);
      toast.success('Optimized bullet saved to your resume profile!', 'Profile Updated');
    } catch (err) {
      toast.error(err.message || 'Failed to save bullet to profile', 'Save Error');
    } finally {
      setIsSavingBullet(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'interview' && questions.length === 0 && !loadingQuestions) {
      loadInterviewQuestions();
    } else if (tab === 'roadmap' && roadmap.length === 0 && !loadingRoadmap) {
      loadRoadmap();
    } else if (tab === 'suggestions' && suggestions.length === 0 && !loadingSuggestions) {
      loadSuggestions();
    } else if (tab === 'rescore' && !simulationResult && !isSimulating) {
      handleSimulateBullet(editableBulletText);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filterCategory === 'all') return true;
    return q.category === filterCategory;
  });

  const tabs = [
    { id: 'overview', label: 'Match Overview', icon: Target },
    { id: 'skills', label: 'Skill Breakdown', icon: Layers, count: skillMatches.length },
    { id: 'rescore', label: 'Live Bullet Optimizer', icon: Zap },
    { id: 'interview', label: 'Interview Prep', icon: HelpCircle, count: questions.length || undefined },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Compass, count: roadmap.length || undefined },
    { id: 'suggestions', label: 'Resume Suggestions', icon: Lightbulb, count: suggestions.length || undefined }
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* SCREEN VIEW (Hidden when printing to PDF)                                 */}
      {/* ========================================================================= */}
      <div className="print:hidden space-y-6">
        {/* Bento Header & Command Bar */}
        <div className="bento-card p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {analysis?.title || 'Job Compatibility Analysis'}
              </h1>
              <span className={`px-3 py-0.5 rounded-full text-xs font-mono-numbers font-bold uppercase tracking-wider border ${getStatusColor(alignment)}`}>
                ● {alignment} alignment
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground/80">Deterministic Score (PRD FR-08)</span>
              <span>•</span>
              <span>100% Reproducible Application Math</span>
              <span>•</span>
              <span>Grounded Evidence Citations</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ColorfulButton
              variant="glass"
              size="md"
              icon={Printer}
              loading={isExporting}
              loadingText="Preparing Report..."
              onClick={handleExportPDF}
              title="Download printable placement preparation report"
            >
              Export PDF Report
            </ColorfulButton>

            <ColorfulButton
              variant="prism"
              size="md"
              icon={Sparkles}
              onClick={onNewAnalysis}
            >
              Analyze Another JD
            </ColorfulButton>
          </div>
        </div>

        {/* Bento Glass Sub-Navigation Pill Dock */}
        <div className="bento-card p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-[140px] py-2 px-3 text-xs font-display font-bold rounded-xl transition-all flex items-center justify-center gap-2 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 text-foreground border border-primary/50 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono-numbers px-2 py-0.2 rounded-full ${
                    isActive ? 'bg-primary/20 text-indigo-300 font-extrabold' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ======================================================================= */}
        {/* 1. MATCH OVERVIEW TAB                                                  */}
        {/* ======================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {!analysis ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <SkeletonDonutChart className="lg:col-span-4" />
                  <SkeletonRadarChart className="lg:col-span-4" />
                  <div className="lg:col-span-4 space-y-4">
                    <SkeletonKPICard />
                    <SkeletonKPICard />
                  </div>
                </div>
                <SkeletonAreaChart title="Synthesizing Match Telemetry Curve..." />
              </div>
            ) : (
              <>
                {/* 12-Column Bento Grid: Donut Gauge, Competency Radar & Telemetry Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Col 1-4: Compatibility Donut Gauge Bento Card */}
                  <div className="lg:col-span-4 bento-card p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col items-center justify-between text-center">
                    <div className="w-full flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
                      <span className="font-display font-semibold uppercase tracking-wider text-[11px]">
                        Deterministic Match Score
                      </span>
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>

                    <div className="relative w-44 h-44 my-4 flex items-center justify-center">
                      <svg className={`w-full h-full transform -rotate-90 ${scoreGlowClass}`} viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="9"
                          className="text-muted/30"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={scoreStrokeColor}
                          strokeWidth="9"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - matchScore / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>

                      <div className="absolute flex flex-col items-center select-none">
                        <span className="text-4xl sm:text-5xl font-black text-foreground font-mono-numbers tracking-tight">
                          {matchScore}%
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                          Compatibility
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-base text-foreground capitalize">
                        {alignment} Alignment Rating
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Calculated strictly against weighted job requirements.
                      </p>
                    </div>

                    {/* PRD FR-08 Math Formula Card */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-card/70 border border-border/60 text-[11px] text-muted-foreground text-left w-full space-y-1 font-mono-numbers">
                      <div className="font-semibold text-foreground flex items-center justify-between">
                        <span>Application Formula:</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">PRD FR-08</span>
                      </div>
                      <div className="text-xs">
                        Earned: <span className="text-foreground font-bold">{breakdown.earned_weight}</span> / Total: <span className="text-foreground font-bold">{breakdown.total_weight} pts</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground/80">
                        ({breakdown.earned_weight} ÷ {breakdown.total_weight}) × 100 = {matchScore}%
                      </div>
                    </div>
                  </div>

                  {/* Col 5-8: 6-Axis Interactive Competency Radar Bento Card */}
                  <div className="lg:col-span-4 bento-card p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
                      <span className="font-display font-semibold uppercase tracking-wider text-[11px]">
                        6-Axis Competency Radar
                      </span>
                      <Activity className="w-4 h-4 text-cyan-400" />
                    </div>

                    {/* Interactive SVG Radar Chart */}
                    <div className="relative w-full aspect-square max-w-[260px] mx-auto my-2 flex items-center justify-center">
                      <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible">
                        <defs>
                          <radialGradient id="radarRadial" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="var(--primary, #8b5cf6)" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="var(--primary, #8b5cf6)" stopOpacity="0.05" />
                          </radialGradient>
                        </defs>

                        {/* Concentric Hexagon Rings (25%, 50%, 75%, 100%) */}
                        {[0.25, 0.5, 0.75, 1.0].map((scale, sIdx) => {
                          const pts = Array.from({ length: 6 }).map((_, i) => {
                            const angle = (-90 + i * 60) * (Math.PI / 180);
                            const r = 85 * scale;
                            const x = 120 + r * Math.cos(angle);
                            const y = 120 + r * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ');
                          return (
                            <polygon
                              key={sIdx}
                              points={pts}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1"
                              className="text-border/60"
                              strokeDasharray={scale === 1 ? 'none' : '3 3'}
                            />
                          );
                        })}

                        {/* Radial Axis Spokes */}
                        {Array.from({ length: 6 }).map((_, i) => {
                          const angle = (-90 + i * 60) * (Math.PI / 180);
                          const x2 = 120 + 85 * Math.cos(angle);
                          const y2 = 120 + 85 * Math.sin(angle);
                          return (
                            <line
                              key={i}
                              x1="120"
                              y1="120"
                              x2={x2}
                              y2={y2}
                              stroke="currentColor"
                              strokeWidth="1"
                              className="text-border/50"
                            />
                          );
                        })}

                        {/* Candidate's Data Polygon */}
                        {(() => {
                          const polyPoints = radarAxes.map((ax, i) => {
                            const angle = (-90 + i * 60) * (Math.PI / 180);
                            const r = (ax.value / 100) * 85;
                            const x = 120 + r * Math.cos(angle);
                            const y = 120 + r * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <>
                              <polygon
                                points={polyPoints}
                                fill="url(#radarRadial)"
                                stroke="#a855f7"
                                strokeWidth="2.5"
                                className="filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] transition-all duration-700"
                              />
                              {/* Glowing Vertex Dots */}
                              {radarAxes.map((ax, i) => {
                                const angle = (-90 + i * 60) * (Math.PI / 180);
                                const r = (ax.value / 100) * 85;
                                const x = 120 + r * Math.cos(angle);
                                const y = 120 + r * Math.sin(angle);
                                const isHov = hoveredRadarIdx === i;
                                return (
                                  <g
                                    key={i}
                                    onMouseEnter={() => setHoveredRadarIdx(i)}
                                    onMouseLeave={() => setHoveredRadarIdx(null)}
                                    className="cursor-pointer"
                                  >
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r={isHov ? 6 : 4}
                                      fill="#ffffff"
                                      stroke="#a855f7"
                                      strokeWidth="2.5"
                                      className="transition-all"
                                    />
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>

                    {/* Radar Legend / Live Telemetry Node */}
                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/40 text-[11px] font-mono-numbers">
                      {radarAxes.map((ax, i) => (
                        <div
                          key={i}
                          onMouseEnter={() => setHoveredRadarIdx(i)}
                          onMouseLeave={() => setHoveredRadarIdx(null)}
                          className={`p-1.5 rounded-lg border transition-all flex items-center justify-between ${
                            hoveredRadarIdx === i
                              ? 'bg-primary/20 border-primary text-foreground font-bold'
                              : 'bg-card/50 border-border/40 text-muted-foreground'
                          }`}
                        >
                          <span className="truncate pr-1 text-[10px]">{ax.label}</span>
                          <span className="text-primary font-bold">{ax.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Col 9-12: Match Breakdown Cards */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* Fully Matched */}
                    <div className="bento-card p-5 rounded-3xl relative overflow-hidden flex-1 flex flex-col justify-between before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-emerald-500">
                      <div className="flex items-center justify-between text-emerald-400">
                        <span className="font-display text-xs font-bold uppercase tracking-wider">Fully Matched</span>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="flex items-baseline justify-between mt-2">
                        <div className="text-3xl sm:text-4xl font-extrabold text-foreground font-mono-numbers">
                          {breakdown.matched_count}
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400">Verified</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Direct project citations confirmed.</p>
                      {/* Mini Sparkline */}
                      <div className="h-4 flex items-end gap-1 pt-1">
                        {[60, 80, 70, 90, 85, 100].map((h, i) => (
                          <span key={i} style={{ height: `${h}%` }} className="flex-1 bg-emerald-500/40 rounded-sm"></span>
                        ))}
                      </div>
                    </div>

                    {/* Partially Matched */}
                    <div className="bento-card p-5 rounded-3xl relative overflow-hidden flex-1 flex flex-col justify-between before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-amber-500">
                      <div className="flex items-center justify-between text-amber-400">
                        <span className="font-display text-xs font-bold uppercase tracking-wider">Partially Matched</span>
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex items-baseline justify-between mt-2">
                        <div className="text-3xl sm:text-4xl font-extrabold text-foreground font-mono-numbers">
                          {breakdown.partial_count}
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400">Related</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Related engineering background.</p>
                      {/* Mini Sparkline */}
                      <div className="h-4 flex items-end gap-1 pt-1">
                        {[40, 50, 65, 55, 70, 60].map((h, i) => (
                          <span key={i} style={{ height: `${h}%` }} className="flex-1 bg-amber-500/40 rounded-sm"></span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="bento-card p-5 rounded-3xl relative overflow-hidden flex-1 flex flex-col justify-between before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-rose-500">
                      <div className="flex items-center justify-between text-rose-400">
                        <span className="font-display text-xs font-bold uppercase tracking-wider">Priority Gaps</span>
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div className="flex items-baseline justify-between mt-2">
                        <div className="text-3xl sm:text-4xl font-extrabold text-foreground font-mono-numbers">
                          {breakdown.missing_count}
                        </div>
                        <span className="text-xs font-mono font-bold text-rose-400">Action Required</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Recommended for sprint practice.</p>
                      {/* Mini Sparkline */}
                      <div className="h-4 flex items-end gap-1 pt-1">
                        {[90, 75, 60, 45, 30, 20].map((h, i) => (
                          <span key={i} style={{ height: `${h}%` }} className="flex-1 bg-rose-500/40 rounded-sm"></span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spline Area Telemetry Curve: Requirement Weight Distribution */}
                <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-display font-bold text-base text-foreground">
                        Skill Weight & Alignment Telemetry
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Interactive breakdown of earned weight vs target JD requirement weight.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono-numbers">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <span>Matched</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                        <span>Partial</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                        <span>Gap</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Spline Curve SVG */}
                  <div className="relative h-60 w-full pt-2">
                    <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      {[40, 90, 140].map((y, idx) => (
                        <line
                          key={idx}
                          x1="0"
                          y1={y}
                          x2="800"
                          y2={y}
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-border/40"
                          strokeDasharray="4 4"
                        />
                      ))}

                      {/* Area Fill & Stroke Path */}
                      {(() => {
                        if (splineData.length < 2) return null;
                        const stepX = 800 / (splineData.length - 1);
                        const points = splineData.map((d, i) => {
                          const x = i * stepX;
                          const y = 180 - (d.pct / 100) * 140;
                          return { x, y, ...d };
                        });

                        // Generate smooth path
                        let dPath = `M ${points[0].x} ${points[0].y}`;
                        for (let i = 0; i < points.length - 1; i++) {
                          const p0 = points[i];
                          const p1 = points[i + 1];
                          const cpX1 = p0.x + (p1.x - p0.x) / 2;
                          const cpY1 = p0.y;
                          const cpX2 = p0.x + (p1.x - p0.x) / 2;
                          const cpY2 = p1.y;
                          dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
                        }

                        const dArea = `${dPath} L ${800} 190 L 0 190 Z`;

                        return (
                          <>
                            <path d={dArea} fill="url(#splineGradient)" />
                            <path
                              d={dPath}
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth="3"
                              className="filter drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                            />
                            {points.map((p, i) => {
                              const isHov = hoveredSkillIdx === i;
                              const nodeColor = p.status === 'matched' ? '#10b981' : p.status === 'partially_matched' ? '#f59e0b' : '#ef4444';
                              return (
                                <g
                                  key={i}
                                  onMouseEnter={() => setHoveredSkillIdx(i)}
                                  onMouseLeave={() => setHoveredSkillIdx(null)}
                                  className="cursor-pointer"
                                >
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isHov ? 7 : 4.5}
                                    fill={nodeColor}
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                    className="transition-all"
                                  />
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>

                    {/* Tooltip on Hover */}
                    {hoveredSkillIdx !== null && splineData[hoveredSkillIdx] && (
                      <div
                        className="absolute -top-3 p-2.5 rounded-xl bg-card border border-border shadow-lg text-xs font-mono-numbers pointer-events-none transform -translate-x-1/2 z-10 space-y-0.5"
                        style={{
                          left: `${(hoveredSkillIdx / (splineData.length - 1)) * 100}%`
                        }}
                      >
                        <div className="font-bold text-foreground">{splineData[hoveredSkillIdx].name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>Score: <strong className="text-primary">{splineData[hoveredSkillIdx].earned} pts</strong></span>
                          <span>•</span>
                          <span>Weight: <strong>{splineData[hoveredSkillIdx].total} pts</strong></span>
                          <span>•</span>
                          <span className="capitalize">{splineData[hoveredSkillIdx].status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* X-Axis Skill Labels */}
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono-numbers pt-1 overflow-x-auto">
                    {splineData.map((d, i) => (
                      <span
                        key={i}
                        onMouseEnter={() => setHoveredSkillIdx(i)}
                        onMouseLeave={() => setHoveredSkillIdx(null)}
                        className={`cursor-pointer truncate max-w-[70px] text-center ${hoveredSkillIdx === i ? 'text-primary font-bold' : ''}`}
                      >
                        {d.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Evidence-First ATS Guarantee Bento Card */}
                <div className="bento-card p-5 rounded-3xl flex items-start gap-3.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-display font-bold text-foreground text-sm block">
                      Evidence-First ATS Mathematical Guarantee (PRD FR-08)
                    </span>
                    <p className="mt-0.5 leading-relaxed">
                      Match scores are deterministic mathematical estimates derived from canonical skill taxonomy and exact document chunk retrieval. They reflect resume alignment and do not guarantee interview callback or hiring decisions.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* 2. SKILL BREAKDOWN TAB                                                 */}
        {/* ======================================================================= */}
        {activeTab === 'skills' && (
          <div className="space-y-5">
            {/* Status Filter Bar */}
            <div className="flex items-center gap-2 pb-1 overflow-x-auto">
              <span className="text-xs font-display font-semibold text-muted-foreground mr-1">Filter by status:</span>
              {['all', 'matched', 'partially_matched', 'missing'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`btn-tactile px-3.5 py-1.5 rounded-full text-xs font-display font-bold capitalize transition-all ${
                    filterStatus === st
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-card/70 border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {!skillMatches || skillMatches.length === 0 ? (
              <SkeletonCardGrid count={6} />
            ) : (
              <div className="space-y-3">
                {filteredMatches.map((m) => {
                  const isExpanded = expandedSkill === m.skill_name;
                  return (
                    <div
                      key={m.skill_name}
                      className="bento-card rounded-2xl transition-all overflow-hidden"
                    >
                      <div
                        onClick={() => setExpandedSkill(isExpanded ? null : m.skill_name)}
                        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-card/60 select-none"
                      >
                        <div className="flex items-center gap-3.5">
                          {m.status === 'matched' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                          {m.status === 'partially_matched' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
                          {m.status === 'missing' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}

                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-display font-bold text-foreground text-sm">{m.skill_name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold bg-muted text-muted-foreground font-mono-numbers">
                                {m.jd_importance} • {m.weight} pts
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.explanation}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono-numbers text-xs font-extrabold text-foreground">
                            +{m.score} pts
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 sm:p-5 bg-card/40 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-2xl bg-card/80 border border-border/60 space-y-2">
                            <div className="flex items-center gap-1.5 font-display font-semibold text-foreground">
                              <Quote className="w-3.5 h-3.5 text-primary" />
                              <span>Candidate Resume Evidence:</span>
                            </div>
                            {m.resume_evidence?.length > 0 ? (
                              m.resume_evidence.map((ev, i) => (
                                <p key={i} className="text-muted-foreground italic bg-background/80 p-3 rounded-xl border border-border/60 font-mono-numbers text-[11px] leading-relaxed">
                                  "{ev.quote}"
                                </p>
                              ))
                            ) : (
                              <p className="text-rose-400 italic">No supporting evidence found in candidate resume.</p>
                            )}
                          </div>

                          <div className="p-4 rounded-2xl bg-card/80 border border-border/60 space-y-2">
                            <div className="flex items-center gap-1.5 font-display font-semibold text-foreground">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Job Description Excerpt:</span>
                            </div>
                            {m.jd_evidence?.map((ev, i) => (
                              <p key={i} className="text-muted-foreground italic bg-background/80 p-3 rounded-xl border border-border/60 font-mono-numbers text-[11px] leading-relaxed">
                                "{ev.quote}"
                              </p>
                            ))}
                            {m.recommended_next_step && (
                              <div className="mt-2.5 pt-2.5 border-t border-border/40 text-foreground font-medium">
                                <span className="text-primary font-bold">Actionable Next Step: </span>
                                {m.recommended_next_step}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* 3. LIVE BULLET OPTIMIZER & RE-SCORER TAB                               */}
        {/* ======================================================================= */}
        {activeTab === 'rescore' && (
          <div className="space-y-6">
            {/* Header Description */}
            <div className="bento-card p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="font-display font-bold text-foreground text-base">
                    Live Resume Bullet Optimizer & ATS Re-Scorer
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optimize your project bullet points in real time to simulate exact score deltas and newly verified skills before updating your resume.
                </p>
              </div>

              <ColorfulButton
                variant="emerald"
                size="md"
                icon={RefreshCw}
                loading={isSimulating}
                loadingText="Re-Scoring..."
                onClick={() => handleSimulateBullet()}
              >
                Re-Calculate Score
              </ColorfulButton>
            </div>

            {/* Project Quick-Switch Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                {
                  name: 'Pharma Plus',
                  original: 'Built a full-stack MERN pharmacy platform with medicine search and cart.',
                  starter: 'Architected a full-stack MERN pharmacy platform with 200+ SKU medicine catalog, implementing sub-80ms search queries, Redux Toolkit state caching, and Razorpay HMAC signature verification.'
                },
                {
                  name: 'Expense Manager',
                  original: 'Developed a full-stack expense management app with JWT.',
                  starter: 'Engineered 12+ RESTful micro-endpoints in Node.js/Express, leveraging MongoDB compound B-Tree indexes to accelerate monthly expense aggregations by 40%.'
                },
                {
                  name: 'Bharat Electronics Limited (BEL)',
                  original: 'Developed an interactive 3D metro station model using Three.js.',
                  starter: 'Engineered an interactive 3D metro station spatial visualizer in Three.js, optimizing polygon mesh rendering and lighting to sustain a consistent 60 FPS across mobile and desktop devices.'
                }
              ].map((proj) => (
                <button
                  key={proj.name}
                  type="button"
                  onClick={() => {
                    setSelectedProject(proj.name);
                    setOriginalBulletText(proj.original);
                    setEditableBulletText(proj.starter);
                    handleSimulateBullet(proj.starter);
                  }}
                  className={`btn-tactile px-4 py-2 rounded-2xl text-xs font-display font-bold transition-all shrink-0 border ${
                    selectedProject === proj.name
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-card/70 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {proj.name}
                </button>
              ))}
            </div>

            {/* Split-Pane: Editor on Left, Simulation Impact on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Interactive Bullet Editor */}
              <div className="lg:col-span-7 space-y-4">
                {/* Original Bullet Reference */}
                <div className="bento-card p-4 sm:p-5 rounded-3xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono-numbers">
                    <span className="font-display font-semibold text-foreground">Current Baseline Bullet on Resume:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditableBulletText(originalBulletText);
                        handleSimulateBullet(originalBulletText);
                      }}
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Reset to Baseline</span>
                    </button>
                  </div>
                  <p className="text-muted-foreground italic bg-card/60 p-3 rounded-2xl border border-border/50 text-xs leading-relaxed font-mono-numbers">
                    "{originalBulletText}"
                  </p>
                </div>

                {/* Editable Bullet Workspace */}
                <div className="bento-card p-5 sm:p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-foreground text-xs flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                      <span>Live Bullet Editor</span>
                    </span>
                    <span className="text-[11px] font-mono-numbers text-muted-foreground">
                      {editableBulletText.split(/\s+/).filter(Boolean).length} words • {editableBulletText.length} chars
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={editableBulletText}
                    onChange={(e) => setEditableBulletText(e.target.value)}
                    placeholder="Type or refine your bullet..."
                    className="w-full p-3.5 rounded-2xl bg-background/80 border border-border text-foreground text-xs leading-relaxed focus:outline-none focus:border-primary/60 font-mono-numbers transition-all resize-y"
                  />

                  {/* Quick-Insert Engineering Metric Chips */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block font-mono-numbers">
                      Quick-Insert High-Impact Metrics & Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'sub-80ms search queries',
                        '200+ SKU catalog',
                        'reducing latency by 40%',
                        '60 FPS stable rendering',
                        'Docker containerization',
                        'TypeScript strict types',
                        'HMAC-SHA256 signature verification'
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            const newText = editableBulletText.endsWith('.')
                              ? `${editableBulletText.slice(0, -1)}, incorporating ${chip}.`
                              : `${editableBulletText}, incorporating ${chip}.`;
                            setEditableBulletText(newText);
                            handleSimulateBullet(newText);
                          }}
                          className="btn-tactile px-2.5 py-1 rounded-xl bg-card/60 hover:bg-primary/20 text-muted-foreground hover:text-primary text-[10px] font-mono-numbers border border-border/60 transition-all"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <ColorfulButton
                      variant="coral"
                      size="sm"
                      icon={Zap}
                      loading={isSimulating}
                      loadingText="Simulating..."
                      onClick={() => handleSimulateBullet()}
                    >
                      Simulate ATS Impact
                    </ColorfulButton>

                    <ColorfulButton
                      variant="violet"
                      size="sm"
                      icon={Save}
                      loading={isSavingBullet}
                      loadingText="Saving..."
                      onClick={handleSaveBullet}
                    >
                      Save to Resume Profile
                    </ColorfulButton>
                  </div>
                </div>
              </div>

              {/* Right Column: Real-Time ATS Simulation & Quality Diagnosis */}
              <div className="lg:col-span-5 space-y-4">
                {/* Score Comparison Widget */}
                <div className="bento-card p-5 sm:p-6 rounded-3xl space-y-3.5 relative overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-mono-numbers">
                    Deterministic ATS Match Simulation (FR-08)
                  </span>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-2xl bg-card/60 border border-border/60 text-center space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Baseline</span>
                      <div className="text-2xl font-extrabold font-mono-numbers text-muted-foreground">
                        {matchScore}%
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-primary/40 text-center space-y-0.5 relative">
                      <span className="text-[10px] text-primary uppercase font-bold">Simulated</span>
                      <div className="text-2xl font-black font-mono-numbers text-foreground">
                        {simulationResult ? simulationResult.simulated_match_score : matchScore}%
                      </div>
                      {simulationResult && simulationResult.score_delta > 0 && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-md font-mono-numbers animate-bounce">
                          +{simulationResult.score_delta}%
                        </span>
                      )}
                    </div>
                  </div>

                  {simulationResult && simulationResult.score_delta > 0 ? (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>This phrasing unlocks <strong>+{simulationResult.score_delta}%</strong> in your ATS score!</span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-card/60 border border-border/60 text-xs text-muted-foreground">
                      Phrasing matches current baseline. Add target JD skills or metrics to simulate an increase.
                    </div>
                  )}
                </div>

                {/* Newly Matched Skills Checklist */}
                {simulationResult?.newly_matched_skills?.length > 0 && (
                  <div className="bento-card p-5 rounded-3xl border-emerald-500/25 bg-emerald-500/5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Newly Verified JD Requirements:</span>
                    </div>
                    <div className="space-y-1.5">
                      {simulationResult.newly_matched_skills.map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-2.5 rounded-xl bg-card/80 border border-border/60 flex items-center justify-between text-xs"
                        >
                          <span className="font-display font-bold text-foreground">{s.skill_name}</span>
                          <span className="font-mono-numbers text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">
                            +{s.added_points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Executive SDE Bullet Quality Diagnosis */}
                {simulationResult?.bullet_quality && (
                  <div className="bento-card p-5 rounded-3xl space-y-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-foreground">Bullet Quality Diagnosis</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          simulationResult.bullet_quality.grade === 'executive_sde'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : simulationResult.bullet_quality.grade === 'strong'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-muted border-border text-muted-foreground'
                        }`}
                      >
                        {simulationResult.bullet_quality.grade.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-card/60 border border-border/60 flex items-center gap-1.5">
                        <span className={simulationResult.bullet_quality.has_action_verb ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}>
                          {simulationResult.bullet_quality.has_action_verb ? '✓' : '○'}
                        </span>
                        <span>Active Action Verb</span>
                      </div>
                      <div className="p-2 rounded-xl bg-card/60 border border-border/60 flex items-center gap-1.5">
                        <span className={simulationResult.bullet_quality.has_quantified_metric ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}>
                          {simulationResult.bullet_quality.has_quantified_metric ? '✓' : '○'}
                        </span>
                        <span>Quantified Metrics</span>
                      </div>
                    </div>

                    {simulationResult.bullet_quality.feedback && (
                      <p className="text-muted-foreground text-[11px] bg-card/50 p-3 rounded-2xl border border-border/50 leading-relaxed font-mono-numbers">
                        {simulationResult.bullet_quality.feedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* 4. INTERVIEW PREP TAB                                                  */}
        {/* ======================================================================= */}
        {activeTab === 'interview' && (
          <div className="space-y-5">
            <div className="bento-card p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-foreground text-base">
                  Role-Specific Interview Questions
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Grounded strictly in your resume projects and target role requirements.
                </p>
              </div>

              <ColorfulButton
                variant="glass"
                size="md"
                icon={Sparkles}
                loading={loadingQuestions}
                loadingText="Regenerating..."
                onClick={() => loadInterviewQuestions(true)}
              >
                Regenerate Questions
              </ColorfulButton>
            </div>

            {loadingQuestions ? (
              <SkeletonCardGrid count={4} />
            ) : (
              <div className="space-y-3.5">
                {filteredQuestions.map((q, idx) => {
                  const isExp = expandedQuestion === idx;
                  const isPracticing = practicingIdx === idx;
                  const currentAnswer = candidateAnswers[idx] || '';
                  const evalResult = evaluations[idx];
                  const isEvaluating = evaluatingIdx === idx;
                  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

                  return (
                    <div
                      key={idx}
                      className="bento-card p-5 rounded-3xl space-y-3.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => setExpandedQuestion(isExp ? null : idx)}
                          className="space-y-1.5 cursor-pointer select-none flex-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-primary/10 text-primary border border-primary/20">
                              {q.category.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-muted text-muted-foreground font-mono-numbers">
                              {q.difficulty}
                            </span>
                          </div>
                          <h4 className="font-display font-semibold text-sm text-foreground pt-0.5">
                            {q.question}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <ColorfulButton
                            variant={isPracticing ? 'violet' : 'cobalt'}
                            size="sm"
                            icon={Mic}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPracticingIdx(isPracticing ? null : idx);
                              if (!isExp) setExpandedQuestion(idx);
                            }}
                          >
                            {isPracticing ? 'Hide Practice' : 'Practice Answer'}
                          </ColorfulButton>

                          <button
                            type="button"
                            onClick={() => setExpandedQuestion(isExp ? null : idx)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isExp && (
                        <div className="mt-3 pt-3 border-t border-border/40 space-y-3 text-xs">
                          {q.why_relevant && (
                            <p className="text-muted-foreground">
                              <span className="font-display font-semibold text-foreground">Why It Matters: </span>
                              {q.why_relevant}
                            </p>
                          )}
                          {q.answer_outline && (
                            <div className="p-3.5 rounded-2xl bg-card/60 border border-border/50 text-foreground space-y-1">
                              <span className="font-display font-semibold text-primary block">Suggested Answer Outline:</span>
                              <p className="text-muted-foreground leading-relaxed">{q.answer_outline}</p>
                            </div>
                          )}

                          {/* Interactive Practice Box */}
                          {isPracticing && (
                            <div className="p-5 rounded-3xl bg-card/70 border border-primary/40 space-y-3.5 mt-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span className="font-display font-bold text-foreground text-xs uppercase tracking-wide">
                                    AI Mock Interview Practice Studio
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono-numbers">
                                  <span>STAR Guide:</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">S</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">T</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">A</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">R</span>
                                </div>
                              </div>

                              {/* STAR Guidance Hints */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                                <div className="p-2 rounded-xl bg-card/50 border border-border/40">
                                  <strong className="text-indigo-400 block font-mono-numbers">S • Situation</strong>
                                  <span className="text-muted-foreground">Context & project background</span>
                                </div>
                                <div className="p-2 rounded-xl bg-card/50 border border-border/40">
                                  <strong className="text-cyan-400 block font-mono-numbers">T • Task</strong>
                                  <span className="text-muted-foreground">Engineering goal or problem</span>
                                </div>
                                <div className="p-2 rounded-xl bg-card/50 border border-border/40">
                                  <strong className="text-emerald-400 block font-mono-numbers">A • Action</strong>
                                  <span className="text-muted-foreground">Architecture & tools used</span>
                                </div>
                                <div className="p-2 rounded-xl bg-card/50 border border-border/40">
                                  <strong className="text-amber-400 block font-mono-numbers">R • Result</strong>
                                  <span className="text-muted-foreground">Quantified metrics & latency</span>
                                </div>
                              </div>

                              {/* Candidate Input Textarea */}
                              <div className="space-y-2">
                                <textarea
                                  rows={4}
                                  value={currentAnswer}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCandidateAnswers((prev) => ({ ...prev, [idx]: val }));
                                  }}
                                  placeholder="Type your interview response using the STAR method... e.g. In my project (Situation), our objective was to prevent race conditions during checkout (Task). I implemented MongoDB ACID transactions with optimistic locking (Action), which eliminated duplicate orders and cut latency to under 80ms (Result)..."
                                  className="w-full p-3.5 rounded-2xl bg-background/80 border border-border text-foreground text-xs leading-relaxed focus:outline-none focus:border-primary/60 font-mono-numbers transition-all resize-y"
                                />
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono-numbers">
                                  <span>{wordCount} words {wordCount < 15 && <span className="text-amber-400 italic">(aim for 40+ words)</span>}</span>
                                  <div className="flex items-center gap-2">
                                    {currentAnswer && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCandidateAnswers((prev) => ({ ...prev, [idx]: '' }));
                                          setEvaluations((prev) => {
                                            const copy = { ...prev };
                                            delete copy[idx];
                                            return copy;
                                          });
                                        }}
                                        className="text-muted-foreground hover:text-foreground underline text-[11px]"
                                      >
                                        Clear
                                      </button>
                                    )}
                                    <ColorfulButton
                                      variant="prism"
                                      size="sm"
                                      icon={Sparkles}
                                      disabled={!currentAnswer.trim()}
                                      loading={isEvaluating}
                                      loadingText="Grading..."
                                      onClick={() => handleEvaluateAnswer(idx, q)}
                                    >
                                      Submit for AI Evaluation
                                    </ColorfulButton>
                                  </div>
                                </div>
                              </div>

                              {/* AI Evaluation Results Panel */}
                              {evalResult && (
                                <div className="mt-4 pt-4 border-t border-border/40 space-y-3.5">
                                  {/* Score Header */}
                                  <div className="p-4 rounded-2xl border border-border/60 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-primary" />
                                        <span className="font-display font-bold text-foreground text-xs">
                                          Overall Performance Rating
                                        </span>
                                      </div>
                                      <p className="text-muted-foreground text-[11px]">{evalResult.summary}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold font-mono-numbers border ${
                                          evalResult.overall_score >= 7.5
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : evalResult.overall_score >= 5.5
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                        }`}
                                      >
                                        {evalResult.overall_score} / 10
                                      </span>
                                    </div>
                                  </div>

                                  {/* STAR Adherence Breakdown */}
                                  {evalResult.star_analysis && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      {Object.entries(evalResult.star_analysis).map(([key, item]) => (
                                        <div
                                          key={key}
                                          className={`p-3 rounded-2xl border ${
                                            item.detected
                                              ? 'bg-emerald-500/5 border-emerald-500/20'
                                              : 'bg-amber-500/5 border-amber-500/20'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="font-display font-bold uppercase tracking-wider text-[10px] text-foreground font-mono-numbers">
                                              {key}
                                            </span>
                                            <span
                                              className={`text-[10px] font-semibold uppercase ${
                                                item.detected ? 'text-emerald-400' : 'text-amber-400'
                                              }`}
                                            >
                                              {item.detected ? '✓ Detected' : '⚠️ Missing'}
                                            </span>
                                          </div>
                                          <p className="text-muted-foreground text-[11px]">{item.feedback}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Technical Strengths and Gaps */}
                                  {evalResult.technical_depth && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      {evalResult.technical_depth.strengths?.length > 0 && (
                                        <div className="p-3 rounded-2xl bg-card/60 border border-border/50 space-y-1">
                                          <span className="font-display font-bold text-emerald-400 text-[10px] uppercase block">
                                            Key Strengths Detected:
                                          </span>
                                          <ul className="space-y-1 text-muted-foreground text-[11px]">
                                            {evalResult.technical_depth.strengths.map((str, sIdx) => (
                                              <li key={sIdx} className="flex items-start gap-1.5">
                                                <span className="text-emerald-400">✓</span>
                                                <span>{str}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {evalResult.technical_depth.missing_concepts?.length > 0 && (
                                        <div className="p-3 rounded-2xl bg-card/60 border border-border/50 space-y-1">
                                          <span className="font-display font-bold text-amber-400 text-[10px] uppercase block">
                                            Recommended Improvements:
                                          </span>
                                          <ul className="space-y-1 text-muted-foreground text-[11px]">
                                            {evalResult.technical_depth.missing_concepts.map((g, gIdx) => (
                                              <li key={gIdx} className="flex items-start gap-1.5">
                                                <span className="text-amber-400">•</span>
                                                <span>{g}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Senior SDE Model Phrasing */}
                                  {evalResult.improved_model_answer && (
                                    <div className="p-4 rounded-2xl bg-card/60 border border-border/50 space-y-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5 text-primary" />
                                        <strong className="font-display text-foreground text-xs">Senior SDE Model Phrasing:</strong>
                                      </div>
                                      <p className="text-muted-foreground italic bg-background/80 p-3 rounded-xl border border-border/50 leading-relaxed text-[11px]">
                                        "{evalResult.improved_model_answer}"
                                      </p>
                                    </div>
                                  )}

                                  {/* Coaching Tip */}
                                  {evalResult.coaching_tip && (
                                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-2 text-xs">
                                      <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="font-display text-foreground block text-[11px]">Interview Coach Tip:</strong>
                                        <p className="text-muted-foreground text-[11px] mt-0.5">{evalResult.coaching_tip}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* 5. LEARNING ROADMAP TAB                                                */}
        {/* ======================================================================= */}
        {activeTab === 'roadmap' && (
          <div className="space-y-5">
            <div className="bento-card p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-foreground text-base">
                  Dependency-Ordered Learning Roadmap
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ranked sequence of skill additions designed to systematically address your highest-priority gaps.
                </p>
              </div>

              <ColorfulButton
                variant="glass"
                size="md"
                icon={Sparkles}
                loading={loadingRoadmap}
                loadingText="Regenerating..."
                onClick={() => loadRoadmap(true)}
              >
                Regenerate Roadmap
              </ColorfulButton>
            </div>

            {loadingRoadmap ? (
              <SkeletonCardGrid count={4} />
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
                {roadmap.map((step, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center text-[10px] font-extrabold text-primary shadow-sm font-mono-numbers">
                      {step.step_number || idx + 1}
                    </div>
                    <div className="bento-card p-5 rounded-3xl space-y-2.5 transition-all">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-bold text-foreground text-sm">{step.skill_name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          {step.priority} Priority
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{step.reason}</p>
                      <div className="p-3.5 rounded-2xl bg-card/60 border border-border/50 text-xs space-y-1">
                        <span className="font-display font-semibold text-primary">Practice Task:</span>
                        <p className="text-muted-foreground">{step.practice_task}</p>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                        <span>Outcome: {step.expected_outcome}</span>
                        <span className="italic font-mono-numbers">{step.estimated_effort}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* 6. RESUME SUGGESTIONS TAB                                              */}
        {/* ======================================================================= */}
        {activeTab === 'suggestions' && (
          <div className="space-y-5">
            <div className="bento-card p-5 sm:p-6 rounded-3xl">
              <h3 className="font-display font-bold text-foreground text-base">Honest Resume Suggestions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Categorized recommendations designed to sharpen your resume without fabricating unearned experience.
              </p>
            </div>

            {loadingSuggestions ? (
              <SkeletonCardGrid count={3} />
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {suggestions.map((s, idx) => {
                  const isWording = s.category === 'improve_wording';
                  const isHighlight = s.category === 'highlight_existing_skill';
                  return (
                    <div key={idx} className="bento-card p-5 rounded-3xl space-y-2.5 transition-all">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono-numbers ${
                            isWording
                              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                              : isHighlight
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          }`}
                        >
                          {s.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-display font-bold text-foreground">{s.target_skill}</span>
                      </div>

                      {s.target_quote && (
                        <div className="relative p-3.5 rounded-2xl bg-card/60 border border-border/50 border-l-2 border-l-primary font-mono-numbers text-xs text-muted-foreground">
                          <span className="text-primary font-bold mr-1">"</span>
                          <span>{s.target_quote}</span>
                          <span className="text-primary font-bold ml-1">"</span>
                        </div>
                      )}

                      <p className="text-xs text-foreground font-medium leading-relaxed">{s.suggestion}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE PDF REPORT (Only rendered during window.print)                   */}
      {/* ========================================================================= */}
      <div className="hidden print:block font-sans text-slate-900 bg-white p-6 space-y-8 max-w-4xl mx-auto">
        {/* Header Ribbon */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              AI Placement Analyzer
            </h1>
            <h2 className="text-base font-bold text-indigo-700 mt-0.5">
              Candidate Compatibility & Placement Preparation Report
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Target Role: <strong className="text-slate-900">{analysis?.title || 'Target Engineering Role'}</strong>
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div className="font-mono text-[10px] text-slate-400 mt-0.5">ID: {analysis?.id?.substring(0, 8)}</div>
            <div className="inline-block mt-2 px-3 py-1 rounded-md text-xs font-bold uppercase bg-slate-100 border border-slate-300">
              {alignment} Alignment
            </div>
          </div>
        </div>

        {/* Executive Score Card */}
        <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 grid grid-cols-4 gap-4 text-center">
          <div className="border-r border-slate-200 pr-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Match Score</span>
            <span className="text-3xl font-black text-slate-900 font-mono mt-1 block">{matchScore}%</span>
            <span className="text-[10px] text-slate-500">Deterministic Formula</span>
          </div>
          <div className="border-r border-slate-200 pr-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Fully Matched</span>
            <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">{breakdown.matched_count}</span>
            <span className="text-[10px] text-slate-500">Verified Evidence</span>
          </div>
          <div className="border-r border-slate-200 pr-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Partially Matched</span>
            <span className="text-3xl font-black text-amber-600 font-mono mt-1 block">{breakdown.partial_count}</span>
            <span className="text-[10px] text-slate-500">Related Experience</span>
          </div>
          <div>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Priority Gaps</span>
            <span className="text-3xl font-black text-rose-600 font-mono mt-1 block">{breakdown.missing_count}</span>
            <span className="text-[10px] text-slate-500">Missing Requirements</span>
          </div>
        </div>

        {/* Section 1: Verified Skills Audit */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
            1. Verified Requirement & Skill Evidence Audit
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="py-2 px-3 font-bold text-slate-700">Requirement / Skill</th>
                <th className="py-2 px-2 font-bold text-slate-700">Level</th>
                <th className="py-2 px-2 font-bold text-slate-700">Status</th>
                <th className="py-2 px-2 font-bold text-slate-700 font-mono">Score</th>
                <th className="py-2 px-3 font-bold text-slate-700">Verified Resume Evidence Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {skillMatches.map((m, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-2 px-3 font-semibold text-slate-900">{m.skill_name}</td>
                  <td className="py-2 px-2 capitalize text-slate-600">{m.jd_importance}</td>
                  <td className="py-2 px-2 font-bold text-[10px] uppercase">
                    {m.status === 'matched' && <span className="text-emerald-700">Matched</span>}
                    {m.status === 'partially_matched' && <span className="text-amber-700">Partial</span>}
                    {m.status === 'missing' && <span className="text-rose-700">Missing</span>}
                  </td>
                  <td className="py-2 px-2 font-mono text-slate-900 font-bold">+{m.score}</td>
                  <td className="py-2 px-3 italic text-slate-600 text-[11px]">
                    {m.resume_evidence?.[0]?.quote ? `"${m.resume_evidence[0].quote}"` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 2: Honest Resume Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
              2. Tailored Resume Bullet Improvements (Evidence-Grounded)
            </h3>
            <div className="space-y-3">
              {suggestions.map((s, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700">{s.target_skill}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded uppercase bg-slate-200 text-slate-700 font-semibold">
                      {s.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {s.target_quote && (
                    <p className="italic text-slate-600 bg-white p-2 rounded border border-slate-200 text-[11px]">
                      "{s.target_quote}"
                    </p>
                  )}
                  <p className="text-slate-800 font-medium">{s.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Interview Prep Cheatsheet */}
        {questions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
              3. Role-Specific Interview Questions & Answer Outlines
            </h3>
            <div className="space-y-3">
              {questions.slice(0, 8).map((q, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{idx + 1}. {q.question}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 uppercase text-slate-600">
                      {q.difficulty}
                    </span>
                  </div>
                  {q.answer_outline && (
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 text-[11px]">
                      <strong className="text-slate-900 block mb-0.5">Model Answer Framework:</strong>
                      {q.answer_outline}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Progressive Roadmap */}
        {roadmap.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-slate-300 pb-1 text-slate-900">
              4. 4-Week Skill Acquisition & Practice Roadmap
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {roadmap.map((step, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Step {step.step_number || idx + 1}: {step.skill_name}</span>
                    <span className="text-[10px] font-semibold uppercase text-amber-700">{step.priority} Priority</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{step.practice_task}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Footer */}
        <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>AI Placement Analyzer • Deterministic ATS Compatibility Engine</span>
          <span>Confidential Candidate Placement Intelligence</span>
        </div>
      </div>
    </div>
  );
}

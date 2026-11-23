import React, { useState } from 'react';
import {
  CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp, Quote, Sparkles,
  BookOpen, HelpCircle, Lightbulb, MapPin, Loader2, ArrowRight, ShieldCheck,
  ListOrdered, Layers, Target, Compass, Printer, Download, FileText,
  Mic, Play, Award, RefreshCw, Send, Check, Zap, Edit3, Save, Copy, ArrowUpRight
} from 'lucide-react';
import { apiClient } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';

export function AnalysisResultsPage({ analysis, onNewAnalysis }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedSkill, setExpandedSkill] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

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
    if (level === 'strong') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    if (level === 'moderate') return 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
  };

  const scoreStrokeColor = matchScore >= 75
    ? '#10B981'
    : matchScore >= 50
    ? '#F59E0B'
    : '#EF4444';

  const scoreGlowClass = matchScore >= 75
    ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]'
    : matchScore >= 50
    ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]'
    : 'drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]';

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
      // Pre-load all sections if not already loaded so report is 100% complete
      const loadTasks = [];
      if (questions.length === 0 && !loadingQuestions) loadTasks.push(loadInterviewQuestions());
      if (roadmap.length === 0 && !loadingRoadmap) loadTasks.push(loadRoadmap());
      if (suggestions.length === 0 && !loadingSuggestions) loadTasks.push(loadSuggestions());

      if (loadTasks.length > 0) {
        await Promise.all(loadTasks);
      }

      // Small delay to ensure printable DOM is populated
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
          originalBullet: originalBulletText
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ========================================================================= */}
      {/* SCREEN VIEW (Hidden when printing to PDF)                                 */}
      {/* ========================================================================= */}
      <div className="print:hidden space-y-6">
        {/* Linear Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {analysis?.title || 'Job Compatibility Analysis'}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(alignment)}`}>
                ● {alignment} alignment
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>Deterministic Score (FR-08)</span>
              <span>•</span>
              <span>100% Reproducible Application Math</span>
              <span>•</span>
              <span>Grounded Evidence Citations</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-sm transition-all hover:scale-[1.01]"
              title="Download printable placement preparation report"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Printer className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{isExporting ? 'Preparing Report...' : 'Export PDF Report'}</span>
            </button>

            <button
              onClick={onNewAnalysis}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_22px_rgba(99,102,241,0.5)] transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze Another JD</span>
            </button>
          </div>
        </div>

        {/* Linear Sub-Navigation Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card border border-border shadow-inner overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-md border border-slate-700/80 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-primary/20 text-indigo-300 font-bold' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Circular Gauge Card */}
              <div className="p-8 rounded-2xl border border-border bg-card shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent pointer-events-none"></div>

                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className={`w-full h-full transform -rotate-90 ${scoreGlowClass}`} viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="9"
                      className="text-muted/40"
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
                    <span className="text-4xl sm:text-5xl font-black text-foreground font-mono tracking-tight">
                      {matchScore}%
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      Compatibility
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-base text-foreground mt-4 capitalize">
                  {alignment} Alignment Rating
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Deterministic mathematical scoring calculated strictly against weighted job requirements.
                </p>

                {/* Formula Card */}
                <div className="mt-4 p-3 rounded-xl bg-background/80 border border-border text-[11px] text-muted-foreground text-left w-full space-y-1 font-mono">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>Application Formula:</span>
                    <span className="text-[10px] text-primary">PRD FR-08</span>
                  </div>
                  <div>Earned: <span className="text-foreground font-bold">{breakdown.earned_weight}</span> / Total: <span className="text-foreground font-bold">{breakdown.total_weight} pts</span></div>
                  <div className="text-[10px] text-muted-foreground/80">({breakdown.earned_weight} ÷ {breakdown.total_weight}) × 100 = {matchScore}%</div>
                </div>
              </div>

              {/* Metric Breakdown Cards */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fully Matched */}
                <div className="p-6 rounded-2xl border border-border bg-card shadow-md flex flex-col justify-between relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-emerald-500">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Fully Matched</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-4xl font-extrabold text-foreground mt-4 font-mono">
                    {breakdown.matched_count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Verified with exact resume project evidence.</p>
                </div>

                {/* Partially Matched */}
                <div className="p-6 rounded-2xl border border-border bg-card shadow-md flex flex-col justify-between relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-amber-500">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Partially Matched</span>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="text-4xl font-extrabold text-foreground mt-4 font-mono">
                    {breakdown.partial_count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Related engineering background demonstrated.</p>
                </div>

                {/* Missing Skills */}
                <div className="p-6 rounded-2xl border border-border bg-card shadow-md flex flex-col justify-between relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-rose-500">
                  <div className="flex items-center justify-between text-rose-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Missing Skills</span>
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div className="text-4xl font-extrabold text-foreground mt-4 font-mono">
                    {breakdown.missing_count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Priority gap areas for study and portfolio.</p>
                </div>

                {/* Disclaimer Banner */}
                <div className="sm:col-span-3 p-4 rounded-xl bg-card border border-border flex items-start gap-3 text-xs text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">Evidence-First ATS Guarantee</span>
                    <p className="mt-0.5 leading-relaxed">
                      Match scores are mathematical estimates derived from canonical skill taxonomy and document chunk retrieval. They reflect resume alignment and do not guarantee interview callback or hiring decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SKILL BREAKDOWN TAB */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 overflow-x-auto">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Filter by status:</span>
              {['all', 'matched', 'partially_matched', 'missing'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                    filterStatus === st
                      ? 'bg-primary text-white shadow-sm font-bold'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredMatches.map((m) => {
                const isExpanded = expandedSkill === m.skill_name;
                return (
                  <div
                    key={m.skill_name}
                    className="rounded-xl border border-border bg-card shadow-sm hover:border-slate-700 transition-all overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedSkill(isExpanded ? null : m.skill_name)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 select-none"
                    >
                      <div className="flex items-center gap-3">
                        {m.status === 'matched' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                        {m.status === 'partially_matched' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
                        {m.status === 'missing' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{m.skill_name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-muted text-muted-foreground font-mono">
                              {m.jd_importance} • {m.weight} pts
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.explanation}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs font-bold text-foreground">
                          +{m.score} pts
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-background/50 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <Quote className="w-3.5 h-3.5 text-primary" />
                            <span>Candidate Resume Evidence:</span>
                          </div>
                          {m.resume_evidence?.length > 0 ? (
                            m.resume_evidence.map((ev, i) => (
                              <p key={i} className="text-muted-foreground italic bg-background/80 p-2.5 rounded-lg border border-border font-mono text-[11px]">
                                "{ev.quote}"
                              </p>
                            ))
                          ) : (
                            <p className="text-rose-400 italic">No supporting evidence found in candidate resume.</p>
                          )}
                        </div>

                        <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Job Description Excerpt:</span>
                          </div>
                          {m.jd_evidence?.map((ev, i) => (
                            <p key={i} className="text-muted-foreground italic bg-background/80 p-2.5 rounded-lg border border-border font-mono text-[11px]">
                              "{ev.quote}"
                            </p>
                          ))}
                          {m.recommended_next_step && (
                            <div className="mt-2 pt-2 border-t border-border text-foreground font-medium">
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
          </div>
        )}

        {/* 3. LIVE BULLET OPTIMIZER & RE-SCORER TAB */}
        {activeTab === 'rescore' && (
          <div className="space-y-5">
            {/* Header Description */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-foreground text-base">Live Resume Bullet Optimizer & ATS Re-Scorer</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optimize your project bullet points in real time to simulate exact score deltas and newly verified skills before updating your resume.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleSimulateBullet()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-all shadow-sm"
                >
                  {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Re-Calculate Score</span>
                </button>
              </div>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                    selectedProject === proj.name
                      ? 'bg-primary text-white border-primary shadow-sm font-bold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span className="font-semibold text-foreground">Current Baseline Bullet on Resume:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditableBulletText(originalBulletText);
                        handleSimulateBullet(originalBulletText);
                      }}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Reset to Baseline</span>
                    </button>
                  </div>
                  <p className="text-muted-foreground italic bg-background/80 p-2.5 rounded-lg border border-border text-xs leading-relaxed font-mono">
                    "{originalBulletText}"
                  </p>
                </div>

                {/* Editable Bullet Workspace */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                      <span>Live Bullet Editor</span>
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {editableBulletText.split(/\s+/).filter(Boolean).length} words • {editableBulletText.length} chars
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={editableBulletText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditableBulletText(val);
                    }}
                    placeholder="Type or refine your bullet..."
                    className="w-full p-3 rounded-xl bg-background border border-border text-foreground text-xs leading-relaxed focus:outline-none focus:border-primary/60 font-mono transition-all resize-y"
                  />

                  {/* Quick-Insert Engineering Metric Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
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
                          className="px-2 py-0.5 rounded-md bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary text-[10px] font-mono border border-border transition-all"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <button
                      type="button"
                      disabled={isSimulating}
                      onClick={() => handleSimulateBullet()}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>Simulate ATS Impact</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSavingBullet}
                      onClick={handleSaveBullet}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-all shadow-sm"
                    >
                      {isSavingBullet ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Save className="w-3.5 h-3.5 text-primary" />}
                      <span>Save to Resume Profile</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Real-Time ATS Simulation & Quality Diagnosis */}
              <div className="lg:col-span-5 space-y-4">
                {/* Score Comparison Widget */}
                <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3 relative overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-mono">
                    Deterministic ATS Match Simulation (FR-08)
                  </span>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-background border border-border text-center space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Baseline</span>
                      <div className="text-xl font-bold font-mono text-muted-foreground">
                        {matchScore}%
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-primary/30 text-center space-y-0.5 relative">
                      <span className="text-[10px] text-primary uppercase font-bold">Simulated</span>
                      <div className="text-xl font-extrabold font-mono text-foreground">
                        {simulationResult ? simulationResult.simulated_match_score : matchScore}%
                      </div>
                      {simulationResult && simulationResult.score_delta > 0 && (
                        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm font-mono animate-bounce">
                          +{simulationResult.score_delta}%
                        </span>
                      )}
                    </div>
                  </div>

                  {simulationResult && simulationResult.score_delta > 0 ? (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>This phrasing unlocks <strong>+{simulationResult.score_delta}%</strong> in your ATS score!</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground">
                      Phrasing matches current baseline. Add target JD skills or metrics to simulate an increase.
                    </div>
                  )}
                </div>

                {/* Newly Matched Skills Checklist */}
                {simulationResult?.newly_matched_skills?.length > 0 && (
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Newly Verified JD Requirements:</span>
                    </div>
                    <div className="space-y-1.5">
                      {simulationResult.newly_matched_skills.map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-2 rounded-lg bg-card border border-border flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-foreground">{s.skill_name}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                            +{s.added_points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Executive SDE Bullet Quality Diagnosis */}
                {simulationResult?.bullet_quality && (
                  <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Bullet Quality Diagnosis</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
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
                      <div className="p-2 rounded bg-background border border-border flex items-center gap-1.5">
                        <span className={simulationResult.bullet_quality.has_action_verb ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}>
                          {simulationResult.bullet_quality.has_action_verb ? '✓' : '○'}
                        </span>
                        <span>Active Action Verb</span>
                      </div>
                      <div className="p-2 rounded bg-background border border-border flex items-center gap-1.5">
                        <span className={simulationResult.bullet_quality.has_quantified_metric ? 'text-emerald-400 font-bold' : 'text-muted-foreground'}>
                          {simulationResult.bullet_quality.has_quantified_metric ? '✓' : '○'}
                        </span>
                        <span>Quantified Metrics</span>
                      </div>
                    </div>

                    {simulationResult.bullet_quality.feedback && (
                      <p className="text-muted-foreground text-[11px] bg-background/80 p-2.5 rounded-lg border border-border leading-relaxed">
                        {simulationResult.bullet_quality.feedback}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. INTERVIEW PREP TAB */}
        {activeTab === 'interview' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
              <div>
                <h3 className="font-bold text-foreground text-base">Role-Specific Interview Questions</h3>
                <p className="text-xs text-muted-foreground">
                  Grounded strictly in your resume projects and target role requirements.
                </p>
              </div>
              <button
                onClick={() => loadInterviewQuestions(true)}
                disabled={loadingQuestions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-all"
              >
                {loadingQuestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                <span>Regenerate Questions</span>
              </button>
            </div>

            {loadingQuestions ? (
              <div className="p-12 text-center text-muted-foreground space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-xs">Synthesizing role-specific interview questions...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((q, idx) => {
                  const isExp = expandedQuestion === idx;
                  const isPracticing = practicingIdx === idx;
                  const currentAnswer = candidateAnswers[idx] || '';
                  const evalResult = evaluations[idx];
                  const isEvaluating = evaluatingIdx === idx;
                  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

                  return (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3 hover:border-slate-700 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => setExpandedQuestion(isExp ? null : idx)}
                          className="space-y-1 cursor-pointer select-none flex-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-primary/10 text-primary border border-primary/20">
                              {q.category.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase bg-muted text-muted-foreground font-mono">
                              {q.difficulty}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-foreground pt-1">{q.question}</h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPracticingIdx(isPracticing ? null : idx);
                              if (!isExp) setExpandedQuestion(idx);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              isPracticing
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>{isPracticing ? 'Hide Practice' : 'Practice Answer'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedQuestion(isExp ? null : idx)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground"
                          >
                            {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isExp && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3 text-xs">
                          {q.why_relevant && (
                            <p className="text-muted-foreground">
                              <span className="font-semibold text-foreground">Why It Matters: </span>
                              {q.why_relevant}
                            </p>
                          )}
                          {q.answer_outline && (
                            <div className="p-3 rounded-xl bg-background/80 border border-border text-foreground space-y-1">
                              <span className="font-semibold text-primary block">Suggested Answer Outline:</span>
                              <p className="text-muted-foreground leading-relaxed">{q.answer_outline}</p>
                            </div>
                          )}

                          {/* Interactive Practice Box */}
                          {isPracticing && (
                            <div className="p-4 rounded-xl bg-background/90 border border-primary/30 space-y-3 mt-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span className="font-bold text-foreground text-xs uppercase tracking-wide">
                                    AI Mock Interview Practice Studio
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                  <span>STAR Framework Guide:</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">S</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">T</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">A</span>
                                  <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">R</span>
                                </div>
                              </div>

                              {/* STAR Guidance Hints */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                                <div className="p-1.5 rounded bg-card border border-border">
                                  <strong className="text-indigo-400 block font-mono">S • Situation</strong>
                                  <span className="text-muted-foreground">Context & project background</span>
                                </div>
                                <div className="p-1.5 rounded bg-card border border-border">
                                  <strong className="text-cyan-400 block font-mono">T • Task</strong>
                                  <span className="text-muted-foreground">Engineering goal or problem</span>
                                </div>
                                <div className="p-1.5 rounded bg-card border border-border">
                                  <strong className="text-emerald-400 block font-mono">A • Action</strong>
                                  <span className="text-muted-foreground">Architecture & tools used</span>
                                </div>
                                <div className="p-1.5 rounded bg-card border border-border">
                                  <strong className="text-amber-400 block font-mono">R • Result</strong>
                                  <span className="text-muted-foreground">Quantified metrics & latency</span>
                                </div>
                              </div>

                              {/* Candidate Input Textarea */}
                              <div className="space-y-1.5">
                                <textarea
                                  rows={4}
                                  value={currentAnswer}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCandidateAnswers((prev) => ({ ...prev, [idx]: val }));
                                  }}
                                  placeholder="Type your interview response using the STAR method... e.g. In my project (Situation), our objective was to prevent race conditions during checkout (Task). I implemented MongoDB ACID transactions with optimistic locking (Action), which eliminated duplicate orders and cut latency to under 80ms (Result)..."
                                  className="w-full p-3 rounded-xl bg-card border border-border text-foreground text-xs leading-relaxed focus:outline-none focus:border-primary/60 font-mono transition-all resize-y"
                                />
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
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
                                    <button
                                      type="button"
                                      disabled={isEvaluating || !currentAnswer.trim()}
                                      onClick={() => handleEvaluateAnswer(idx, q)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                                    >
                                      {isEvaluating ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          <span>Grading Answer...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-3.5 h-3.5" />
                                          <span>Submit for AI Evaluation</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* AI Evaluation Results Panel */}
                              {evalResult && (
                                <div className="mt-4 pt-4 border-t border-border space-y-3.5 animate-fadeIn">
                                  {/* Score Header */}
                                  <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-primary" />
                                        <span className="font-bold text-foreground text-xs">Overall Performance Rating</span>
                                      </div>
                                      <p className="text-muted-foreground text-[11px]">{evalResult.summary}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
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
                                          className={`p-2.5 rounded-lg border ${
                                            item.detected
                                              ? 'bg-emerald-500/5 border-emerald-500/20'
                                              : 'bg-amber-500/5 border-amber-500/20'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold uppercase tracking-wider text-[10px] text-foreground font-mono">
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
                                        <div className="p-2.5 rounded-lg bg-card border border-border space-y-1">
                                          <span className="font-bold text-emerald-400 text-[10px] uppercase block">
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
                                        <div className="p-2.5 rounded-lg bg-card border border-border space-y-1">
                                          <span className="font-bold text-amber-400 text-[10px] uppercase block">
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
                                    <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5 text-primary" />
                                        <strong className="text-foreground text-xs">Senior SDE Model Phrasing:</strong>
                                      </div>
                                      <p className="text-muted-foreground italic bg-background/80 p-2.5 rounded-lg border border-border leading-relaxed text-[11px]">
                                        "{evalResult.improved_model_answer}"
                                      </p>
                                    </div>
                                  )}

                                  {/* Coaching Tip */}
                                  {evalResult.coaching_tip && (
                                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2 text-xs">
                                      <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="text-foreground block text-[11px]">Interview Coach Tip:</strong>
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

        {/* 4. LEARNING ROADMAP TAB */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="font-bold text-foreground text-base">Dependency-Ordered Learning Roadmap</h3>
                <p className="text-xs text-muted-foreground">
                  Ranked sequence of skill additions designed to systematically address your highest-priority gaps.
                </p>
              </div>
              <button
                onClick={() => loadRoadmap(true)}
                disabled={loadingRoadmap}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-all"
              >
                {loadingRoadmap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                <span>Regenerate Roadmap</span>
              </button>
            </div>

          {loadingRoadmap ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-xs">Generating progressive learning milestones...</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
              {roadmap.map((step, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary shadow-sm font-mono">
                    {step.step_number || idx + 1}
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground text-sm">{step.skill_name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {step.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.reason}</p>
                    <div className="p-3 rounded-lg bg-background/80 border border-border text-xs space-y-1">
                      <span className="font-semibold text-primary">Practice Task:</span>
                      <p className="text-muted-foreground">{step.practice_task}</p>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                      <span>Outcome: {step.expected_outcome}</span>
                      <span className="italic font-mono">{step.estimated_effort}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. RESUME SUGGESTIONS TAB */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-foreground text-base">Honest Resume Suggestions</h3>
            <p className="text-xs text-muted-foreground">
              Categorized recommendations designed to sharpen your resume without fabricating unearned experience.
            </p>
          </div>

          {loadingSuggestions ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-xs">Analyzing resume wording and gaps...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((s, idx) => {
                const isWording = s.category === 'improve_wording';
                const isHighlight = s.category === 'highlight_existing_skill';
                return (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2.5 hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isWording
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                            : isHighlight
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                        }`}
                      >
                        {s.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-foreground">{s.target_skill}</span>
                    </div>

                    {s.target_quote && (
                      <div className="relative p-3 rounded-lg bg-background/80 border border-border border-l-2 border-l-primary font-mono text-xs text-muted-foreground">
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

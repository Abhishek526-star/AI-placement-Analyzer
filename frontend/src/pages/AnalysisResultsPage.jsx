import React, { useState } from 'react';
import {
  CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp, Quote, Sparkles,
  BookOpen, HelpCircle, Lightbulb, MapPin, Loader2, ArrowRight, ShieldCheck,
  ListOrdered, Layers, Target, Compass
} from 'lucide-react';
import { apiClient } from '../lib/api.js';

export function AnalysisResultsPage({ analysis, onNewAnalysis }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedSkill, setExpandedSkill] = useState(null);

  // Career Intelligence States
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

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
    } catch (err) {
      alert('Failed to load interview questions: ' + (err.message || 'Unknown error'));
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
    } catch (err) {
      alert('Failed to load learning roadmap: ' + (err.message || 'Unknown error'));
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
    } catch (err) {
      alert('Failed to load resume suggestions: ' + (err.message || 'Unknown error'));
    } finally {
      setLoadingSuggestions(false);
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
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filterCategory === 'all') return true;
    return q.category === filterCategory;
  });

  const tabs = [
    { id: 'overview', label: 'Match Overview', icon: Target },
    { id: 'skills', label: 'Skill Breakdown', icon: Layers, count: skillMatches.length },
    { id: 'interview', label: 'Interview Prep', icon: HelpCircle, count: questions.length || undefined },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Compass, count: roadmap.length || undefined },
    { id: 'suggestions', label: 'Resume Suggestions', icon: Lightbulb, count: suggestions.length || undefined }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
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
            onClick={onNewAnalysis}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_22px_rgba(99,102,241,0.5)] transition-all"
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

      {/* 3. INTERVIEW PREP TAB */}
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
                return (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2 hover:border-slate-700 transition-all">
                    <div
                      onClick={() => setExpandedQuestion(isExp ? null : idx)}
                      className="flex items-start justify-between cursor-pointer select-none"
                    >
                      <div className="space-y-1">
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
                      {isExp ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>

                    {isExp && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs">
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
  );
}

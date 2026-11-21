import React, { useState } from 'react';
import {
  CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp, Quote, Sparkles,
  BookOpen, HelpCircle, Lightbulb, MapPin, Loader2, ArrowRight, ShieldCheck, ListOrdered
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
    if (level === 'strong') return 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60';
    if (level === 'moderate') return 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-950/60';
    return 'text-rose-600 dark:text-rose-400 border-rose-500 bg-rose-50 dark:bg-rose-950/60';
  };

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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Persistent Analysis Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{analysis?.title || 'Job Compatibility Analysis'}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(alignment)}`}>
              {alignment} alignment
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deterministic application calculation • 100% reproducible • Grounded AI synthesis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNewAnalysis}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze Another JD</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/60 border border-border overflow-x-auto">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex-1 min-w-[120px] py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'overview' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Match Overview
        </button>
        <button
          onClick={() => handleTabChange('skills')}
          className={`flex-1 min-w-[140px] py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'skills' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Skill Gaps & Evidence ({skillMatches.length})
        </button>
        <button
          onClick={() => handleTabChange('interview')}
          className={`flex-1 min-w-[120px] py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'interview' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Interview Prep
        </button>
        <button
          onClick={() => handleTabChange('roadmap')}
          className={`flex-1 min-w-[130px] py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'roadmap' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Learning Roadmap
        </button>
        <button
          onClick={() => handleTabChange('suggestions')}
          className={`flex-1 min-w-[140px] py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'suggestions' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Resume Suggestions
        </button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl border border-border bg-card shadow-sm flex flex-col items-center justify-center text-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-muted/60"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - matchScore / 100)}`}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold text-foreground font-mono">{matchScore}%</span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Score</span>
                </div>
              </div>

              <h3 className="font-bold text-lg text-foreground mt-4 capitalize">{alignment} Alignment</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Calculated strictly by deterministic application math based on earned requirement weights.
              </p>

              <div className="mt-4 p-3 rounded-lg bg-muted/60 border border-border text-[11px] text-muted-foreground text-left w-full space-y-1 font-mono">
                <div className="font-semibold text-foreground">Mathematical Breakdown (FR-08):</div>
                <div>Earned: {breakdown.earned_weight} / Total: {breakdown.total_weight} pts</div>
                <div>Formula: ({breakdown.earned_weight} / {breakdown.total_weight}) × 100 = {matchScore}%</div>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="text-xs font-bold uppercase tracking-wider">Fully Matched</span>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-4xl font-bold text-foreground mt-4 font-mono">{breakdown.matched_count}</div>
                <p className="text-xs text-muted-foreground mt-1">Supported by verified resume evidence.</p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-600">
                  <span className="text-xs font-bold uppercase tracking-wider">Partially Matched</span>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="text-4xl font-bold text-foreground mt-4 font-mono">{breakdown.partial_count}</div>
                <p className="text-xs text-muted-foreground mt-1">Related background demonstrated.</p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-rose-600">
                  <span className="text-xs font-bold uppercase tracking-wider">Missing Skills</span>
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="text-4xl font-bold text-foreground mt-4 font-mono">{breakdown.missing_count}</div>
                <p className="text-xs text-muted-foreground mt-1">Priority focus areas for learning.</p>
              </div>

              <div className="sm:col-span-3 p-4 rounded-xl bg-muted/40 border border-border flex items-start gap-3 text-xs text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">Informational & Strategic Guidance</span>
                  <p>
                    Match scores are objective estimates derived from the uploaded resume and job description. They represent preparation alignment and do not guarantee hiring outcomes or automated ATS acceptance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SKILL GAPS & EVIDENCE TAB */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Filter by status:</span>
            {['all', 'matched', 'partially_matched', 'missing'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  filterStatus === st
                    ? 'bg-primary text-white shadow-sm'
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
                  className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedSkill(isExpanded ? null : m.skill_name)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 select-none"
                  >
                    <div className="flex items-center gap-3">
                      {m.status === 'matched' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                      {m.status === 'partially_matched' && <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />}
                      {m.status === 'missing' && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">{m.skill_name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-muted text-muted-foreground">
                            {m.jd_importance} • {m.weight} pts
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.explanation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        +{m.score} pts
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-muted/30 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-lg bg-card border border-border space-y-2">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Quote className="w-3.5 h-3.5 text-primary" />
                          <span>Resume Evidence:</span>
                        </div>
                        {m.resume_evidence?.length > 0 ? (
                          m.resume_evidence.map((ev, i) => (
                            <p key={i} className="text-muted-foreground italic bg-muted/40 p-2 rounded border border-border">
                              "{ev.quote}"
                            </p>
                          ))
                        ) : (
                          <p className="text-rose-500 italic">No supporting evidence found in candidate resume.</p>
                        )}
                      </div>

                      <div className="p-3.5 rounded-lg bg-card border border-border space-y-2">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          <span>JD Requirement Excerpt:</span>
                        </div>
                        {m.jd_evidence?.map((ev, i) => (
                          <p key={i} className="text-muted-foreground italic bg-muted/40 p-2 rounded border border-border">
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
              <h3 className="font-bold text-foreground text-base">Grounded Interview Questions</h3>
              <p className="text-xs text-muted-foreground">
                Grounded strictly in your resume projects and target role requirements.
              </p>
            </div>
            <button
              onClick={() => loadInterviewQuestions(true)}
              disabled={loadingQuestions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
            >
              {loadingQuestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Regenerate Questions</span>
            </button>
          </div>

          {loadingQuestions ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-xs">Synthesizing role-specific interview questions...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q, idx) => {
                const isExp = expandedQuestion === idx;
                return (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
                    <div
                      onClick={() => setExpandedQuestion(isExp ? null : idx)}
                      className="flex items-start justify-between cursor-pointer select-none"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-primary/10 text-primary border border-primary/20">
                            {q.category.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase bg-muted text-muted-foreground">
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
                          <div className="p-3 rounded-lg bg-muted/40 border border-border text-foreground space-y-1">
                            <span className="font-semibold block">Suggested Answer Outline:</span>
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
                Prioritized preparation plan focusing on high-weight job requirement gaps.
              </p>
            </div>
          </div>

          {loadingRoadmap ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-xs">Generating prioritized preparation roadmap...</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-primary/30 space-y-6 my-4">
              {roadmap.map((step, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[31px] top-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {step.step_number || idx + 1}
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground text-sm">{step.skill_name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200">
                        {step.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.reason}</p>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                      <span className="font-semibold text-foreground">Practice Task:</span>
                      <p className="text-muted-foreground">{step.practice_task}</p>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                      <span>Outcome: {step.expected_outcome}</span>
                      <span className="italic">{step.estimated_effort}</span>
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
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-xs">Analyzing resume wording and gaps...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((s, idx) => {
                const isWording = s.category === 'improve_wording';
                const isHighlight = s.category === 'highlight_existing_skill';
                return (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isWording
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : isHighlight
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {s.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{s.target_skill}</span>
                    </div>
                    {s.target_quote && (
                      <p className="text-xs italic text-muted-foreground bg-muted/40 p-2 rounded border border-border">
                        "{s.target_quote}"
                      </p>
                    )}
                    <p className="text-xs text-foreground font-medium">{s.suggestion}</p>
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

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.js';
import { Target, Clock, ArrowRight, Trash2, Edit2, Loader2, Sparkles, Check, X, TrendingUp } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';
import { SkeletonCardGrid } from '../components/ui/Skeletons.jsx';

export function AnalysisHistoryPage({ onOpenAnalysis, onNewAnalysis }) {
  const { toast } = useToast();
  const { skeletonSimulator } = useTheme();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchHistory = () => {
    setLoading(true);
    apiClient('/analyses?page=1&limit=20')
      .then((data) => {
        setAnalyses(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load history:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
      await apiClient(`/analyses/${id}`, { method: 'DELETE' });
      toast.success('Analysis deleted successfully', 'Deleted');
      fetchHistory();
    } catch (err) {
      toast.error(err.message || 'Unknown error', 'Failed to Delete Analysis');
    }
  };

  const handleStartRename = (a, e) => {
    e.stopPropagation();
    setEditingId(a.id);
    setEditTitle(a.title);
  };

  const handleSaveRename = async (id, e) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;

    try {
      await apiClient(`/analyses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editTitle.trim() })
      });
      toast.success('Analysis title updated', 'Renamed');
      setEditingId(null);
      fetchHistory();
    } catch (err) {
      toast.error(err.message || 'Unknown error', 'Failed to Rename Analysis');
    }
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const getScoreBadge = (score) => {
    if (score >= 75) {
      return {
        cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        spark: 'bg-emerald-400'
      };
    }
    if (score >= 50) {
      return {
        cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
        spark: 'bg-amber-400'
      };
    }
    return {
      cls: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]',
      spark: 'bg-rose-400'
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Analysis History & Telemetry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {analyses.length} Records
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Review past Resume-to-JD comparisons, score breakdowns, and skill gap roadmaps.
          </p>
        </div>

        <ColorfulButton
          variant="prism"
          size="md"
          icon={Sparkles}
          onClick={onNewAnalysis}
        >
          New Match Analysis
        </ColorfulButton>
      </div>

      {loading || skeletonSimulator ? (
        <SkeletonCardGrid count={5} />
      ) : analyses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {analyses.map((a) => {
            const badge = getScoreBadge(a.match_score);
            return (
              <div
                key={a.id}
                onClick={() => onOpenAnalysis(a.id)}
                className="bento-card p-5 sm:p-6 rounded-3xl cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Jewel Match Score Squircle */}
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono-numbers font-black text-lg shrink-0 ${badge.cls}`}>
                    <span>{a.match_score}%</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold opacity-80">Match</span>
                  </div>

                  <div className="space-y-1">
                    {editingId === a.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="px-3 py-1 text-sm rounded-xl border border-primary bg-background text-foreground focus:outline-none font-display font-bold"
                          autoFocus
                        />
                        <button
                          onClick={(e) => handleSaveRename(a.id, e)}
                          className="p-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-card"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-display font-bold text-foreground text-base tracking-tight hover:text-primary transition-colors">
                        {a.title}
                      </h3>
                    )}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground font-mono-numbers">
                      <span className="capitalize px-2 py-0.2 rounded-full bg-card/60 border border-border/40 text-foreground/80 font-semibold">
                        {a.alignment_level} Alignment
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  {/* Mini Sparkline Telemetry */}
                  <div className="hidden md:flex h-5 items-end gap-1 px-3">
                    {[45, 65, 55, 80, 70, 95].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${(h * (a.match_score / 100))}%` }}
                        className={`w-1 rounded-sm ${badge.spark}`}
                      ></span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => handleStartRename(a, e)}
                    title="Rename Analysis"
                    className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(a.id, e)}
                    title="Delete Analysis"
                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ColorfulButton
                    variant="glass"
                    size="sm"
                    icon={ArrowRight}
                  >
                    View Details
                  </ColorfulButton>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bento-card text-center py-20 rounded-3xl space-y-3">
          <Target className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
          <h3 className="font-display font-bold text-foreground text-base">No saved analyses</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Upload your resume and paste a job description to get your first deterministic match score.
          </p>
          <div className="pt-2">
            <ColorfulButton variant="prism" size="md" icon={Sparkles} onClick={onNewAnalysis}>
              Start Analysis
            </ColorfulButton>
          </div>
        </div>
      )}
    </div>
  );
}

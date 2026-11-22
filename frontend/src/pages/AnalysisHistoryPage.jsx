import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.js';
import { Target, Clock, ArrowRight, Trash2, Edit2, Loader2, Sparkles, Check, X } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';

export function AnalysisHistoryPage({ onOpenAnalysis, onNewAnalysis }) {
  const { toast } = useToast();
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

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">Loading analysis history...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analysis History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review past Resume-to-JD comparisons, score breakdowns, and skill gap roadmaps.
          </p>
        </div>

        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ New Match Analysis</span>
        </button>
      </div>

      {analyses.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {analyses.map((a) => (
            <div
              key={a.id}
              onClick={() => onOpenAnalysis(a.id)}
              className="p-5 rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 cursor-pointer flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-base">
                  {a.match_score}%
                </div>

                <div>
                  {editingId === a.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="px-2.5 py-1 text-sm rounded border border-primary bg-background text-foreground focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={(e) => handleSaveRename(a.id, e)}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 rounded text-muted-foreground hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-bold text-foreground text-base">{a.title}</h3>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="capitalize">{a.alignment_level} Alignment</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleStartRename(a, e)}
                  title="Rename Analysis"
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(a.id, e)}
                  title="Delete Analysis"
                  className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="font-semibold text-foreground text-base">No saved analyses</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Upload your resume and paste a job description to get your first deterministic match score.
          </p>
          <button
            onClick={onNewAnalysis}
            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm"
          >
            Start Analysis
          </button>
        </div>
      )}
    </div>
  );
}

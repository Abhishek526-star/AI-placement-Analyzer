import React from 'react';
import { LayoutDashboard, FileText, Target, History, Settings, Sparkles, Database, CheckCircle2 } from 'lucide-react';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'resumes', label: 'My Resumes', icon: FileText },
  { id: 'analyze', label: 'New Analysis', icon: Target },
  { id: 'history', label: 'Analysis History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentView, onNavigate }) {
  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col shrink-0 min-h-[calc(100vh-4rem)] transition-colors">
      {/* Primary Action Button */}
      <div className="p-4 border-b border-border/80">
        <button
          onClick={() => onNavigate('analyze')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white text-xs font-bold shadow-[0_0_18px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ New Match Analysis</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold border border-primary/25 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-border/80 text-[11px] text-muted-foreground space-y-2 bg-muted/20">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
          <span>Deterministic ATS Engine</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Database className="w-3 h-3 text-primary shrink-0" />
          <span>Hybrid RAG (pgvector + FTS)</span>
        </div>
        <div className="text-[10px] text-muted-foreground/75 font-mono">
          Model: Gemini 3.5 Flash Cascade
        </div>
      </div>
    </aside>
  );
}

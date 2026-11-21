import React from 'react';
import { LayoutDashboard, FileText, Target, History, Settings, Sparkles } from 'lucide-react';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'resumes', label: 'My Resumes', icon: FileText },
  { id: 'analyze', label: 'New Analysis', icon: Target },
  { id: 'history', label: 'Analysis History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentView, onNavigate }) {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-border">
        <button
          onClick={() => onNavigate('analyze')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ New Match Analysis</span>
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border text-xs text-muted-foreground space-y-1">
        <div className="font-semibold text-foreground">AI Placement Analyzer</div>
        <div>Deterministic scoring locked</div>
        <div>Hybrid RAG (pgvector + FTS)</div>
      </div>
    </aside>
  );
}

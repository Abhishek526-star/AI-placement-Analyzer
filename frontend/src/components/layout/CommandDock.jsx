import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ColorfulButton } from '../ui/ColorfulButton.jsx';
import {
  Sparkles, LayoutDashboard, FileText, Target, History,
  Settings, LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'resumes', label: 'My Resumes', icon: FileText },
  { id: 'analyze', label: 'New Match', icon: Target },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function CommandDock({ currentView, onNavigate, onOpenAuth }) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-3 z-50 max-w-[1440px] mx-auto px-3 sm:px-6 w-full no-print">
      <nav className="p-2 sm:px-4 sm:py-2.5 rounded-3xl backdrop-blur-2xl border border-[var(--dock-border)] bg-[var(--dock-bg)] shadow-2xl flex items-center justify-between gap-2.5 transition-all">
        
        {/* Left: Brand Mark */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-all">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              <span>AI Placement Analyzer</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[10px] font-mono-numbers text-primary font-semibold tracking-wider uppercase">
              Bento-Cockpit
            </div>
          </div>
        </div>

        {/* Center: Colorful Navigation Pills */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-black/15 border border-border/40">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all select-none font-display ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/35 shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: User Auth Controls & Primary CTA */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
              <ColorfulButton
                variant="prism"
                size="md"
                onClick={() => onNavigate('analyze')}
                icon={Target}
              >
                New Match
              </ColorfulButton>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                Sign In
              </button>
              <ColorfulButton
                variant="prism"
                size="md"
                onClick={() => onOpenAuth('signup')}
              >
                Get Started
              </ColorfulButton>
            </div>
          )}
        </div>

      </nav>
    </header>
  );
}

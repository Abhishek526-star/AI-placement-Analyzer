import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Sun, Moon, LogIn, LogOut, Sparkles, ShieldCheck } from 'lucide-react';

export function Navbar({ onOpenAuth, onNavigate, currentView }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-[0_0_18px_rgba(99,102,241,0.35)] group-hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] transition-all">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">
                AI Placement Analyzer
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Deterministic ATS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation & Controls */}
        <nav className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent hover:border-border transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-mono truncate max-w-[180px]">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted hover:border-slate-700 transition-all shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-[0_0_16px_rgba(99,102,241,0.35)] hover:shadow-[0_0_22px_rgba(99,102,241,0.5)] transition-all"
              >
                Get Started
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
